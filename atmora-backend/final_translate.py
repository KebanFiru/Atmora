import os

final_translations = {
    '429 errorlarına özel akıllı retry decorator': '429 error smart retry decorator',
    '429 Hatası - Deneme': '429 Error - Retry',
    'bekleniyor...': 'waiting...',
    'HTTP Hatası': 'HTTP Error',
    'Deneme': 'Retry',
    "Hedef tarih 2025-01-01 veya sonrası olmalıdır (eğitim verisi 2024-12-31'de bitiyor)": 'Target date must be 2025-01-01 or later (training data ends at 2024-12-31)'
}

def final_translate(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    for turkish, english in final_translations.items():
        content = content.replace(turkish, english)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Translated: {filepath}")

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        if 'venv' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    final_translate(filepath)
                except Exception as e:
                    print(f"Error: {filepath}: {e}")

if __name__ == '__main__':
    process_directory('app')
    print("Final translation completed!")
