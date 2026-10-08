"""Independent Python reference; never imports JS or resolver.
Writes only stdout. Run explicitly to compare against committed rng-vectors.json.
"""
import json
STREAMS = ['draw', 'effect', 'symbolOffer', 'itemOffer', 'event']

def fnv(text):
    h = 2166136261
    for b in text.encode('utf-16le', 'surrogatepass'):
        h = ((h ^ b) * 16777619) & 0xffffffff
    return h or 1

def xs(x):
    x ^= (x << 13) & 0xffffffff
    x ^= x >> 17
    x ^= (x << 5) & 0xffffffff
    return x & 0xffffffff

vectors = []
for seed, profile in [('F1-GOLDEN','slice-abd-v1'), ('雾港🌫','slice-abd-v1'), ('','full-v1'), ('F1-GOLDEN','full-v1')]:
    streams = {}
    for name in STREAMS:
        identity = json.dumps(['GDD1','GDD1',profile,'Normal',seed,name], ensure_ascii=False, separators=(',',':'))
        initial = x = fnv(identity)
        values = []
        for _ in range(8):
            x = xs(x)
            values.append(x)
        streams[name] = {'initial':initial, 'values':values, 'consumed':8}
    vectors.append({'seed':seed,'profile':profile,'difficulty':'Normal','streams':streams})
print(json.dumps({'algorithm':'fnv1a-utf16le-xorshift32-v1','vectors':vectors}, ensure_ascii=False, indent=2))
