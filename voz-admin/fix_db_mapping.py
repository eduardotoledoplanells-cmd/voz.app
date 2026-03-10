import os

def fix_db():
    p = r"c:\Users\Mis Documentos.RETROTIENDAS-HO\Desktop\APP\VOZ\server\voz-admin\src\lib\db.ts"
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    
    # In getVideos:
    # return data.map(v => ({
    # ...
    #         isAd: v.is_ad
    #     }));
    
    # We want to replace "isAd: v.is_ad" with the new fields
    # Let's search for "isAd: v.is_ad" with potential whitespace
    
    # Actually, I'll use a very specific replace
    new_fields = """        isAd: v.is_ad,
        thumbnailUrl: v.thumbnail_url,
        isPinned: v.is_pinned"""
    
    # Check if there is already a comma or not
    if "isAd: v.is_ad," in c:
        c = c.replace("isAd: v.is_ad,", new_fields)
    else:
        c = c.replace("isAd: v.is_ad", new_fields)
        
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Fixed db.ts")

fix_db()
