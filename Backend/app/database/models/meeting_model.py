from datetime import date as date_type
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class MeetingMetadata(Base):
    __tablename__ = "meeting_metadata"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False)

    summary: Mapped[Optional["MeetingSummary"]] = relationship(
        "MeetingSummary", back_populates="meeting_metadata", cascade="all, delete-orphan"
    )
    transcription: Mapped[Optional["MeetingTranscription"]] = relationship(
        "MeetingTranscription", back_populates="meeting_metadata", cascade="all, delete-orphan"
    )


class MeetingSummary(Base):
    __tablename__ = "meeting_summaries"

    id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meeting_metadata.id"), primary_key=True, index=True
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False)

    meeting_metadata: Mapped["MeetingMetadata"] = relationship(
        "MeetingMetadata", back_populates="summary"
    )


class MeetingTranscription(Base):
    __tablename__ = "meeting_transcriptions"

    id: Mapped[int] = mapped_column(
        Integer, ForeignKey("meeting_metadata.id"), primary_key=True, index=True
    )
    transcription: Mapped[str] = mapped_column(Text, nullable=False)

    meeting_metadata: Mapped["MeetingMetadata"] = relationship(
        "MeetingMetadata", back_populates="transcription"
    )
