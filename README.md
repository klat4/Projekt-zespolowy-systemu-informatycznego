# Projekt zespołowy systemu informatycznego

TechALL, grupa F. Aplikacja webowa do prezentacji wykresów i analizy technicznej.

## Frontend — bazowy wykres liniowy z CSV

Strona w katalogu `frontend/` wczytuje plik CSV z serwera i rysuje linię ceny zamknięcia.

Wymagane kolumny: `date`, `close`. Opcjonalnie: `ticker`. Przykład: `frontend/data/cdr.csv`.

```bash
cd frontend
python3 -m http.server 8080
```

Otwórz [http://127.0.0.1:8080/](http://127.0.0.1:8080/).

Inny plik z tego samego serwera: `http://127.0.0.1:8080/?csv=data/inny.csv`.
