import os
import re

def fix_news_js(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Precise regex to match the nested <p> cluster across line endings
    pattern = r'<p className="news-date">\s*<p className="news-date">([\s\S]*?)</p>\s*</p>'
    replacement = r'<div className="news-date">\1</div>'
    
    new_content = re.sub(pattern, replacement, content)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
    else:
        print(f"No match found for News.js pattern")

def clean_css_files(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.css'):
                filepath = os.path.join(root, file)
                if "index.css" in filepath: continue
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Remove @keyframes bgGradientShift { ... }
                new_content = re.sub(r'@keyframes bgGradientShift \{(.*?)\}', '', content, flags=re.DOTALL)
                
                # Remove redundant properties
                new_content = re.sub(r'background: var\(--grad-mesh\);', '', new_content)
                new_content = re.sub(r'background-size: 300% 300%;', '', new_content)
                new_content = re.sub(r'animation: bgGradientShift(.*?);', '', new_content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Cleaned {filepath}")

if __name__ == "__main__":
    fix_news_js(r"d:\NeighborNet\NeighborNet\src\pages\News.js")
    clean_css_files(r"d:\NeighborNet\NeighborNet\src\pages")
    clean_css_files(r"d:\NeighborNet\NeighborNet\src")
