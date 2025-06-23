import sqlite3
import numpy as np
from datetime import datetime, timedelta
from sentence_transformers import SentenceTransformer
import chromadb
from typing import List, Dict, Any
import json
import logging
import os

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, db_path: str = "database/temperature.db"):
        self.db_path = db_path

        try:
            self.model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("Modèle SentenceTransformer chargé")
        except Exception as e:
            logger.error(f"Erreur chargement modèle: {e}")
            self.model = None

        try:
            self.chroma_client = chromadb.Client()
            self.collection = self.chroma_client.get_or_create_collection("weather_data")
            logger.info("ChromaDB initialisé")
        except Exception as e:
            logger.error(f"Erreur ChromaDB: {e}")
            self.collection = None

        self.ensure_tables_exist()
        self.initialize_embeddings()

    def ensure_tables_exist(self):
        """Assure que les tables existent"""
        try:
            # Créer le répertoire database s'il n'existe pas
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute('''
            CREATE TABLE IF NOT EXISTS temperature_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                temperature REAL NOT NULL
            )
            ''')
            conn.commit()
            conn.close()
            logger.info("Tables assurées dans RAGEngine")
        except Exception as e:
            logger.error(f"Erreur création tables RAG: {e}")

    def initialize_embeddings(self):
        """Initialise les embeddings des données météorologiques"""
        try:
            if not self.collection or not self.model:
                logger.warning("ChromaDB ou modèle non disponible, initialisation d'embeddings ignorée")
                return

            # Vérifier si les embeddings existent déjà
            if self.collection.count() > 0:
                logger.info("Embeddings déjà initialisés")
                return

            # Récupérer les données historiques
            historical_data = self._get_historical_data()

            if not historical_data:
                logger.warning("Aucune donnée historique trouvée pour les embeddings")
                return

            # Créer les documents et embeddings
            documents = []
            metadatas = []
            ids = []

            for i, data in enumerate(historical_data):
                doc_text = self._create_document_text(data)
                documents.append(doc_text)
                metadatas.append({
                    'date': data['date'],
                    'temperature': data['temperature'],
                    'hour': data.get('hour', 0),
                    'category': 'temperature_reading'
                })
                ids.append(f"temp_{i}")

            # Ajouter à ChromaDB
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )

            logger.info(f"Initialisé {len(documents)} embeddings")

        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation des embeddings: {e}")

    def _get_historical_data(self) -> List[Dict]:
        """Récupère les données historiques depuis SQLite"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Récupérer les données des 30 derniers jours
            thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

            cursor.execute('''
                SELECT timestamp, temperature
                FROM temperature_data
                WHERE timestamp >= ?
                ORDER BY timestamp DESC
                LIMIT 1000
            ''', (thirty_days_ago,))

            data = []
            for row in cursor.fetchall():
                try:
                    timestamp = datetime.fromisoformat(row['timestamp'].replace('Z', '+00:00'))
                    data.append({
                        'date': timestamp.strftime('%Y-%m-%d'),
                        'hour': timestamp.hour,
                        'temperature': float(row['temperature']),
                        'timestamp': row['timestamp']
                    })
                except Exception as e:
                    logger.warning(f"Erreur parsing timestamp {row['timestamp']}: {e}")
                    continue

            conn.close()
            logger.info(f"Récupéré {len(data)} enregistrements historiques")
            return data

        except sqlite3.OperationalError as e:
            if "no such table" in str(e):
                logger.warning("Table temperature_data n'existe pas")
                return []
            logger.error(f"Erreur SQL: {e}")
            return []
        except Exception as e:
            logger.error(f"Erreur récupération données: {e}")
            return []

    def _create_document_text(self, data: Dict) -> str:
        """Crée le texte du document pour l'embedding"""
        date = data['date']
        temp = data['temperature']
        hour = data.get('hour', 0)

        return f"Le {date} à {hour}h, la température était de {temp}°C. Date: {date}, Température: {temp}°C, Heure: {hour}h"

    def search_relevant_data(self, query: str, n_results: int = 5) -> List[Dict]:
        """Recherche les données pertinentes pour une requête"""
        try:
            if not self.collection:
                logger.warning("ChromaDB non disponible, retour de données vides")
                return []

            results = self.collection.query(
                query_texts=[query],
                n_results=n_results
            )

            relevant_data = []
            if results['documents'] and results['documents'][0]:
                for i, doc in enumerate(results['documents'][0]):
                    metadata = results['metadatas'][0][i]
                    relevant_data.append({
                        'content': doc,
                        'metadata': metadata,
                        'distance': results['distances'][0][i] if 'distances' in results else None
                    })

            logger.info(f"Trouvé {len(relevant_data)} résultats pour la requête")
            return relevant_data

        except Exception as e:
            logger.error(f"Erreur recherche: {e}")
            return []

    def get_statistics(self, date_filter: str = None) -> Dict:
        """Calcule des statistiques pour enrichir le contexte"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            where_clause = ""
            params = []
            if date_filter:
                where_clause = "WHERE DATE(timestamp) = ?"
                params.append(date_filter)

            cursor.execute(f'''
                SELECT 
                    AVG(temperature) as avg_temp,
                    MIN(temperature) as min_temp,
                    MAX(temperature) as max_temp,
                    COUNT(*) as count
                FROM temperature_data
                {where_clause}
            ''', params)

            result = cursor.fetchone()
            conn.close()

            if result and result[0] is not None:
                stats = {
                    'average': round(float(result[0]), 2),
                    'minimum': round(float(result[1]), 2),
                    'maximum': round(float(result[2]), 2),
                    'count': int(result[3])
                }
                logger.info(f"Statistiques calculées: {stats}")
                return stats
            else:
                logger.warning("Aucune donnée trouvée pour les statistiques")
                return {}

        except Exception as e:
            logger.error(f"Erreur calcul statistiques: {e}")
            return {}