"""Aplikasi Flask billing rental PlayStation."""
from flask import Flask

from billing.api import api_bp
from billing.db import init_db
from billing.sessions import sessions_bp


def create_app() -> Flask:
    app = Flask(__name__)
    init_db()
    app.register_blueprint(api_bp)
    app.register_blueprint(sessions_bp)

    @app.get("/")
    def index():
        return "Billing Rental PlayStation API — dashboard menyusul di F3"

    return app


if __name__ == "__main__":
    create_app().run(host="0.0.0.0", port=5000, debug=False)
