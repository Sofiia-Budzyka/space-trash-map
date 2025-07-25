import requests
import sqlite3
import os
# URL с TLE-данными (2-строчный формат, без названия)
TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=TLE"
DB_PATH = "debris.db"

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS debris (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            tle1 TEXT,
            tle2 TEXT
        )
    """)
    conn.commit()
    conn.close()


def insert_tle_data(name, line1, line2):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO debris (name, tle1, tle2)
        VALUES (?, ?, ?)
    """, (name, line1, line2))
    conn.commit()
    conn.close()

def fetch_and_store_tle():
    print(f"\n🌐 Загружаем TLE-данные с {TLE_URL} ...")
    response = requests.get(TLE_URL)

    if response.status_code != 200:
        print(f"❌ Ошибка загрузки: {response.status_code}")
        return

    lines = [line.strip() for line in response.text.splitlines() if line.strip()]
    inserted = 0
    skipped = 0
    i = 0

    while i < len(lines) - 1:
        line1 = lines[i]
        line2 = lines[i + 1]

        if line1.startswith("1 ") and line2.startswith("2 "):
            norad_id = line1.split()[1][:5]
            name = f"Object-{norad_id}"
            insert_tle_data(name, line1, line2)
            inserted += 1
            i += 2
        else:
            skipped += 1
            i += 1

    print(f"✅ Загружено в базу: {inserted} объектов.")
    if skipped > 0:
        print(f"⚠️ Пропущено {skipped} строк (неполные пары или ошибка формата).")

def reset_database():
    print("\n🧹 Очищаем базу данных...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM debris")
    conn.commit()
    conn.close()
    print("✅ База очищена.")

if __name__ == "__main__":
    print("🛰 Обновление базы данных космического мусора...")
    init_db()  # ← вот эта строка
    reset_database()
    fetch_and_store_tle()
    print("🚀 Готово!\n")
