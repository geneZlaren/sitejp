# models.py
from extensions import db
from sqlalchemy.dialects.postgresql import JSONB


class Usuario(db.Model):
    __tablename__ = "usuarios"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    senha = db.Column(db.String(100), nullable=False)
    empresa = db.Column(db.String(120), nullable=False)
    aprovado = db.Column(db.Boolean, nullable=False, default=False)

    projetos = db.relationship(
        "Projeto",
        backref="usuario",
        lazy=True,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Projeto(db.Model):
    __tablename__ = "projetos"

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.String(500))
    responsavel = db.Column(db.String(120))
    usuario_id = db.Column(db.Integer, db.ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    periodos = db.Column(db.Integer, nullable=False)
    melhor_metodo = db.Column(db.String(100))
    mad = db.Column(db.Float)
    previsao_prox = db.Column(db.Float)
    detalhes_json = db.Column(JSONB)

    demandas = db.relationship(
        "Demanda",
        backref="projeto",
        lazy=True,
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class Demanda(db.Model):
    __tablename__ = "demandas"

    id = db.Column(db.Integer, primary_key=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey("projetos.id", ondelete="CASCADE"), nullable=False)
    periodo = db.Column(db.Integer, nullable=False)
    valor = db.Column(db.Integer, nullable=False)
