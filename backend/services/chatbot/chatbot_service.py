import sqlite3
from typing import Dict, Any
from datetime import datetime, timedelta  # Import corrigé
from .rag_engine import RAGEngine
from .llm_interface import LLMInterface
import re
import logging

# Configuration du logging pour debug
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ChatbotService:
    def __init__(self):
        try:
            self.ensure_tables_exist()  # D'abord créer les tables
            self.create_sample_data()   # Puis créer des données d'exemple
            self.rag_engine = RAGEngine()
            self.llm_interface = LLMInterface()
            logger.info("ChatbotService initialisé avec succès")
        except Exception as e:
            logger.error(f"Erreur initialisation ChatbotService: {e}")
            raise

    def ensure_tables_exist(self):
        """Vérifie que les tables SQLite existent"""
        try:
            conn = sqlite3.connect("database/temperature.db")
            cursor = conn.cursor()

            # Créer la table si elle n'existe pas
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS temperature_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                temperature REAL NOT NULL
            )
            ''')
            conn.commit()
            conn.close()
            logger.info("Tables vérifiées/créées")
        except Exception as e:
            logger.error(f"Erreur création tables: {e}")
            raise

    def create_sample_data(self):
        """Crée des données d'exemple si la table est vide"""
        try:
            conn = sqlite3.connect("database/temperature.db")
            cursor = conn.cursor()

            # Vérifier si des données existent
            cursor.execute("SELECT COUNT(*) FROM temperature_data")
            count = cursor.fetchone()[0]

            if count == 0:
                logger.info("Création de données d'exemple...")
                # Créer des données d'exemple pour les 7 derniers jours
                base_date = datetime.now()

                for days_back in range(7):
                    current_date = base_date - timedelta(days=days_back)

                    # 24 mesures par jour (une par heure)
                    for hour in range(24):
                        timestamp = current_date.replace(hour=hour, minute=0, second=0, microsecond=0)
                        # Température simulée entre 15 et 25°C avec variation horaire
                        temp = 20 + 5 * (hour / 24) + (days_back * 0.5)

                        cursor.execute('''
                            INSERT INTO temperature_data (timestamp, temperature)
                            VALUES (?, ?)
                        ''', (timestamp.isoformat(), temp))

                conn.commit()
                logger.info(f"Créé {7 * 24} enregistrements d'exemple")

            conn.close()
        except Exception as e:
            logger.error(f"Erreur création données d'exemple: {e}")

    def process_message(self, message: str, user_id: str = None) -> Dict[str, Any]:
        """Traite un message utilisateur et retourne une réponse"""
        try:
            logger.info(f"Traitement du message: {message}")

            # Préprocessing de la requête
            processed_query = self._preprocess_query(message)
            logger.info(f"Requête preprocessée: {processed_query}")

            # Extraire la date si mentionnée
            date_filter = self._extract_date(message)
            logger.info(f"Filtre de date: {date_filter}")

            # Rechercher les données pertinentes
            relevant_data = self.rag_engine.search_relevant_data(processed_query)
            logger.info(f"Données pertinentes trouvées: {len(relevant_data)}")

            # Calculer les statistiques
            statistics = self.rag_engine.get_statistics(date_filter)
            logger.info(f"Statistiques: {statistics}")

            # Générer la réponse
            response = self.llm_interface.generate_response(
                processed_query,
                relevant_data,
                statistics
            )
            logger.info(f"Réponse générée: {response[:100]}...")

            return {
                'success': True,
                'response': response,
                'timestamp': datetime.now().isoformat(),
                'context_used': len(relevant_data),
                'statistics': statistics
            }

        except Exception as e:
            logger.error(f"Erreur traitement message: {e}")
            return {
                'success': False,
                'error': str(e),
                'response': f"Erreur technique: {str(e)}. Si le problème persiste, vérifiez la base de données.",
                'timestamp': datetime.now().isoformat()
            }

    def _preprocess_query(self, query: str) -> str:
        """Préprocesse la requête utilisateur"""
        # Normaliser les accents et la casse
        query = query.lower().strip()

        # Remplacer les abréviations communes
        replacements = {
            'temp': 'température',
            'humid': 'humidité',
            'moy': 'moyenne',
            'max': 'maximum',
            'min': 'minimum'
        }

        for abbrev, full in replacements.items():
            query = query.replace(abbrev, full)

        return query

    def _extract_date(self, query: str) -> str:
        """Extrait une date de la requête si présente"""
        today = datetime.now()

        if 'aujourd\'hui' in query.lower() or 'aujourd hui' in query.lower():
            return today.strftime('%Y-%m-%d')
        elif 'hier' in query.lower():
            yesterday = today - timedelta(days=1)
            return yesterday.strftime('%Y-%m-%d')

        # Pattern pour dates YYYY-MM-DD ou DD/MM/YYYY
        date_patterns = [
            r'\d{4}-\d{2}-\d{2}',
            r'\d{2}/\d{2}/\d{4}'
        ]

        for pattern in date_patterns:
            match = re.search(pattern, query)
            if match:
                date_str = match.group()
                try:
                    if '/' in date_str:
                        # Convertir DD/MM/YYYY vers YYYY-MM-DD
                        day, month, year = date_str.split('/')
                        return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    return date_str
                except:
                    continue

        return None