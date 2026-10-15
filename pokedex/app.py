import os
from flask import Flask, flash, redirect, render_template, request, url_for
import yaml

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "fallback_secret_key")

USER_FILE = "users.yml"


def load_users():
    if not os.path.exists(USER_FILE):
        return {"users": []}
    with open(USER_FILE, "r") as file:
        data = yaml.safe_load(file)
        return data if data else {"users": []}


def save_users(data):
    with open(USER_FILE, "w") as file:
        yaml.safe_dump(data, file)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/pokedex")
def pokedex():
    return render_template("pokedex.html")


@app.route("/login", methods=["POST"])
def login():
    username = request.form.get("username")
    password = request.form.get("password")

    data = load_users()

    for user in data["users"]:
        if user["username"] == username and user["password"] == password:
            flash(f"Welcome back, {username}!", "success")
            return redirect(url_for("home"))

    flash("Invalid username or password.", "danger")
    return redirect(url_for("home"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        data = load_users()

        for user in data["users"]:
            if user["username"] == username:
                flash("Username already exists!", "danger")
                return redirect(url_for("register"))

        data["users"].append({"username": username, "password": password})
        save_users(data)

        flash("Registration successful! Please log in.", "success")
        return redirect(url_for("home"))

    return render_template("register.html")


if __name__ == "__main__":
    app.run(debug=True)
