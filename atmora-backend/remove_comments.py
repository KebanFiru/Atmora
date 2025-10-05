import os
import re

def remove_comments_from_file(filepath):
    """Remove all # comment lines from a Python file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        stripped = line.lstrip()
        if stripped.startswith('#') and not stripped.startswith('#!'):
            continue
        line_without_inline_comment = re.sub(r'\s+#[^"]*$', '', line.rstrip()) + '\n'
        new_lines.append(line_without_inline_comment if line_without_inline_comment.strip() else line)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Processed: {filepath}")

def process_directory(directory):
    """Process all Python files in directory recursively"""
    for root, dirs, files in os.walk(directory):
        if 'venv' in root or '__pycache__' in root:
            continue
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                try:
                    remove_comments_from_file(filepath)
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

if __name__ == '__main__':
    process_directory('app')
    print("Comment removal completed!")
