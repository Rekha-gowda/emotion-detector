import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

def create_and_save_model():
    # Make synthetic data
    n_samples = 1000
    np.random.seed(42)
    session_duration = np.random.randint(1, 60, n_samples)
    pages_visited = np.random.randint(1, 30, n_samples)
    device_type = np.random.choice(['desktop', 'mobile', 'tablet'], n_samples)
    
    # Generate labels based on some rules
    labels = []
    for d, p in zip(session_duration, pages_visited):
        if p > 15 and d > 20:
            labels.append('Purchase')
        elif p < 5 and d < 5:
            labels.append('Bounce')
        else:
            labels.append('Return')
            
    df = pd.DataFrame({
        'session_duration_minutes': session_duration,
        'pages_visited': pages_visited,
        'device_type': device_type
    })
    
    # Encode categorical
    le_device = LabelEncoder()
    df['device_type'] = le_device.fit_transform(df['device_type'])
    
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(df, labels)
    
    # Save model and encoders
    joblib.dump(clf, 'behavior_model.pkl')
    joblib.dump(le_device, 'device_encoder.pkl')
    print("Model trained and saved successfully.")

if __name__ == "__main__":
    create_and_save_model()
