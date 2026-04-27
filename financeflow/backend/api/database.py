import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_DEFAULT_DB = "sqlite:///" + os.path.join(_ROOT, "financeflow.db")
DATABASE_URL = os.environ.get("FINANCEFLOW_DATABASE_URL", _DEFAULT_DB)


class Base(DeclarativeBase):
    pass


engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from api import db_models  # noqa: F401 — register models

    Base.metadata.create_all(bind=engine)
