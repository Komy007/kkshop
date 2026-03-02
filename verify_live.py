import urllib.request, re

try:
    req = urllib.request.Request('https://kkshop.cc', headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    chunks = re.findall(r'src=\"(/_next/static/chunks/[^\"]+\.js)\"', html)
    print(f"Found {len(chunks)} JS chunks on the live site.")

    found = False
    for chunk in chunks:
        url = 'https://kkshop.cc' + chunk
        js = urllib.request.urlopen(req.__class__(url, headers=req.headers)).read().decode('utf-8')
        if '닫기 (Close)' in js or '회사 소개 (About Us)' in js:
            print(f"SUCCESS: Found the new mobile menu text in {chunk}!")
            found = True
            break

    if not found:
        print("ERROR: Could not find the new text in any JS bundle on kkshop.cc")

except Exception as e:
    print("Error:", str(e))
