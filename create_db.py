from app import app
from extensions import db
from models import Demanda, Projeto, Usuario

with app.app_context():
    db.create_all()
    print("Tabelas criadas com sucesso!")
