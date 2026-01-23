import sys
sys.path.append('C:/Users/ASHROCK/Desktop/project1/backend')

from app.services.ml_auto_learn import retrain_all_models_auto_learn
from app.core.database import SessionLocal

db = SessionLocal()

print('Testing Revenue Auto-Learning')
print('=' * 60)

try:
    # Call the main auto-learn function
    result = retrain_all_models_auto_learn(db)
    
    print(f'\nOverall Status: {result.get("status")}')
    print(f'Message: {result.get("message")}')
    
    # Check revenue-specific results
    revenue_results = result.get('results', {}).get('revenue', {})
    
    if revenue_results:
        print('\n' + '=' * 60)
        print('REVENUE AUTO-LEARNING RESULTS:')
        print('=' * 60)
        
        for model_type, model_result in revenue_results.items():
            print(f'\n{model_type.upper()}:')
            if isinstance(model_result, dict):
                print(f'  Status: {model_result.get("status")}')
                if model_result.get('status') == 'trained':
                    print(f'  MAE: {model_result.get("mae")}')
                    print(f'  RMSE: {model_result.get("rmse")}')
                    print(f'  Data Points: {model_result.get("data_points")}')
                else:
                    print(f'  Message: {model_result.get("message", "No details")}')
            else:
                print(f'  Result: {model_result}')
    else:
        print('\nNo revenue results found in response')
    
    print('\n' + '=' * 60)
    
except Exception as e:
    print(f'\nError: {str(e)}')
    import traceback
    traceback.print_exc()

finally:
    db.close()
