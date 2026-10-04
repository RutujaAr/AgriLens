import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="farmer", nullable=False)  # 'farmer' or 'officer'
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    datasets = relationship("DatasetRecord", back_populates="owner", cascade="all, delete-orphan")


class DatasetRecord(Base):
    __tablename__ = "dataset_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # 'csv', 'xlsx', 'json'
    file_size_bytes = Column(Integer, nullable=False)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    is_official_sample = Column(Boolean, default=False)
    is_cleaned = Column(Boolean, default=False)
    quality_score = Column(Float, default=0.0)
    
    raw_file_path = Column(String(500), nullable=True)
    cleaned_file_path = Column(String(500), nullable=True)
    
    # Persistent dataset content for ephemeral cloud deployment survival
    raw_data_content = Column(Text, nullable=True)
    cleaned_data_content = Column(Text, nullable=True)

    # Serialized JSON metadata
    profile_json = Column(Text, nullable=True)
    cleaning_report_json = Column(Text, nullable=True)

    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="datasets")
