import os

# Mapping full names to short codes
suits = {
    "spades": "S",
    "hearts": "H",
    "diamonds": "D",
    "clubs": "C"
}
values = {
    "ace": "A",
    "2": "2", "3": "3", "4": "4", "5": "5",
    "6": "6", "7": "7", "8": "8", "9": "9", "10": "10",
    "jack": "J", "queen": "Q", "king": "K"
}

# Target folder
folder = "./public/cards/"

for filename in os.listdir(folder):
    if "joker" in filename.lower():
        continue

    try:
        name = filename.lower().replace(".png", "").replace("_2", "")
        value_name, suit_name = name.split("_of_")
        short = f"{values[value_name]}{suits[suit_name]}.png"
        os.rename(os.path.join(folder, filename), os.path.join(folder, short))
        print(f"✅ {filename} -> {short}")
    except Exception as e:
        print(f"❌ Skip {filename} — {e}")

