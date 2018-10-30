
import pandas as pd
import json

fc = pd.read_csv("muASR.csv")
vals = fc['Value'].tolist()
with open('../muASR.json', 'w') as f:
	json.dump(vals,f)
