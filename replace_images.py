import os
import re

directory = 'c:/Users/ADMIN/Desktop/fintrack/frontend/src/pages'

logo_regex = re.compile(r'https://lh3\.googleusercontent\.com/aida/[a-zA-Z0-9_\-]+')
avatar_regex = re.compile(r'https://lh3\.googleusercontent\.com/aida-public/[a-zA-Z0-9_\-]+')

for filename in os.listdir(directory):
    if filename.endswith(".jsx"):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace logos with /favicon.svg
        content = logo_regex.sub('/favicon.svg', content)
        
        # Replace avatars with ui-avatars placeholder
        content = avatar_regex.sub('https://ui-avatars.com/api/?name=Arjun+Patel&background=0b1f3a&color=fff', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)

print("Images replaced successfully.")
