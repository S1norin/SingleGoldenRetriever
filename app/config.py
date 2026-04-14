import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Centralized configuration for the chat application.
    Automatically loads from environment variables or a .env file.
    """

    # Kafka Configuration
    # Defaulting to localhost:9092 for local development
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_topic: str = "user-messages"
    kafka_group_id: str = "chat-consumer-group"

    # App Configuration
    log_level: str = "INFO"

    # Pydantic Settings configuration
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        # This allows us to use lowercase env vars like KAFKA_TOPIC
        # to map to the field kafka_topic
        extra="ignore",
    )


# Instantiate a single settings object to be used throughout the application
settings = Settings()
