import openai
import os
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class LLMInterface:
    def __init__(self):
        # Configuration OpenAI (optionnel, peut utiliser Hugging Face à la place)
        openai.api_key = os.getenv('OPENAI_API_KEY')
        self.use_openai = bool(os.getenv('OPENAI_API_KEY'))
        logger.info(f"LLM Interface initialisé - OpenAI: {self.use_openai}")

    def generate_response(self, query: str, context: List[Dict], statistics: Dict) -> str:
        """Génère une réponse basée sur le contexte récupéré"""
        try:
            # Construire le prompt avec le contexte
            context_text = self._build_context(context, statistics)
            logger.info(f"Contexte construit: {len(context_text)} caractères")

            if self.use_openai:
                return self._generate_with_openai(query, context_text)
            else:
                return self._generate_simple_response(query, context, statistics)
        except Exception as e:
            logger.error(f"Erreur génération réponse: {e}")
            return "Désolé, je n'ai pas pu générer une réponse. Veuillez réessayer."

    def _build_context(self, context: List[Dict], statistics: Dict) -> str:
        """Construit le contexte pour le LLM"""
        context_parts = []

        # Ajouter les données pertinentes
        for item in context:
            context_parts.append(item['content'])

        # Ajouter les statistiques
        if statistics:
            stats_text = f"Statistiques: Moyenne {statistics.get('average', 0)}°C, "
            stats_text += f"Min {statistics.get('minimum', 0)}°C, "
            stats_text += f"Max {statistics.get('maximum', 0)}°C, "
            stats_text += f"Nombre de mesures: {statistics.get('count', 0)}"
            context_parts.append(stats_text)

        return "\n".join(context_parts)

    def _generate_with_openai(self, query: str, context: str) -> str:
        """Génère une réponse avec OpenAI"""
        try:
            prompt = f"""
            Tu es un assistant spécialisé dans l'analyse de données météorologiques.
            Réponds en français de manière claire et précise.
            
            Contexte des données:
            {context}
            
            Question de l'utilisateur: {query}
            
            Réponse:
            """

            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                temperature=0.7
            )

            return response.choices[0].message.content.strip()

        except openai.error.AuthenticationError:
            logger.error("Erreur d'authentification OpenAI")
            return "Erreur d'authentification avec l'API OpenAI"
        except Exception as e:
            logger.error(f"Erreur OpenAI: {e}")
            return self._generate_simple_response(query, [], {})

    def _generate_simple_response(self, query: str, context: List[Dict], statistics: Dict) -> str:
        """Génère une réponse simple sans LLM externe"""
        query_lower = query.lower()
        logger.info(f"Génération réponse simple pour: {query_lower}")

        # Vérifier si on a des statistiques
        if not statistics:
            return "Je n'ai pas trouvé de données de température pour répondre à votre question. Assurez-vous que la base de données contient des données."

        # Réponses basées sur des mots-clés
        if 'température' in query_lower or 'temp' in query_lower:
            if 'moyenne' in query_lower or 'moy' in query_lower:
                avg = statistics.get('average', 0)
                count = statistics.get('count', 0)
                return f"La température moyenne est de {avg}°C sur {count} mesures."

            elif 'maximum' in query_lower or 'max' in query_lower:
                max_temp = statistics.get('maximum', 0)
                return f"La température maximale enregistrée est de {max_temp}°C."

            elif 'minimum' in query_lower or 'min' in query_lower:
                min_temp = statistics.get('minimum', 0)
                return f"La température minimale enregistrée est de {min_temp}°C."

            elif 'aujourd\'hui' in query_lower or 'aujourd hui' in query_lower:
                return self._generate_today_response(statistics)

            else:
                # Réponse générale sur la température
                return self._generate_general_temperature_response(statistics)

        # Autres questions
        if 'données' in query_lower or 'combien' in query_lower:
            count = statistics.get('count', 0)
            return f"J'ai {count} mesures de température dans ma base de données."

        if 'tendance' in query_lower or 'évolution' in query_lower:
            return self._generate_trend_response(statistics)

        # Réponse par défaut avec statistiques
        return self._generate_general_temperature_response(statistics)

    def _generate_today_response(self, statistics: Dict) -> str:
        """Génère une réponse pour aujourd'hui"""
        if not statistics:
            return "Je n'ai pas de données pour aujourd'hui."

        avg = statistics.get('average', 0)
        min_temp = statistics.get('minimum', 0)
        max_temp = statistics.get('maximum', 0)
        count = statistics.get('count', 0)

        return f"Aujourd'hui: température moyenne de {avg}°C (min: {min_temp}°C, max: {max_temp}°C) sur {count} mesures."

    def _generate_general_temperature_response(self, statistics: Dict) -> str:
        """Génère une réponse générale sur la température"""
        avg = statistics.get('average', 0)
        min_temp = statistics.get('minimum', 0)
        max_temp = statistics.get('maximum', 0)
        count = statistics.get('count', 0)

        return f"Voici les données de température : moyenne {avg}°C, minimum {min_temp}°C, maximum {max_temp}°C. Ces statistiques sont basées sur {count} mesures."

    def _generate_trend_response(self, statistics: Dict) -> str:
        """Génère une réponse sur les tendances"""
        avg = statistics.get('average', 0)
        min_temp = statistics.get('minimum', 0)
        max_temp = statistics.get('maximum', 0)

        variation = max_temp - min_temp

        if variation > 10:
            trend = "forte variation"
        elif variation > 5:
            trend = "variation modérée"
        else:
            trend = "variation faible"

        return f"La température varie entre {min_temp}°C et {max_temp}°C, soit une {trend} de {variation:.1f}°C autour de la moyenne de {avg}°C."