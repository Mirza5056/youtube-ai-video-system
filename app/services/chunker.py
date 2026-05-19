

def chuck_text(text,chuck_size=3000):
    chunks=[]
    for i in range(0,len(text),chuck_size):
        chunks.append(text[i:i+chuck_size])

    return chunks