from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

engine = create_engine('postgresql://postgres:amare@localhost/projectai')
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

# Check monthly distribution
result = db.execute(text(
    "SELECT DATE_TRUNC('month', date) as month, COUNT(*) as count "
    "FROM revenue_entries WHERE is_approved = true "
    "GROUP BY month ORDER BY month"
)).fetchall()

print('Revenue Data Distribution by Month:')
print('=' * 50)
for row in result:
    print(f'{row[0].strftime("%Y-%m")}: {row[1]} records')

print('=' * 50)
print(f'Total unique months: {len(result)}')
print(f'Total approved records: {sum(r[1] for r in result)}')
print()
print('DIAGNOSIS:')
if len(result) < 12:
    print(f'❌ INSUFFICIENT DATA: You have only {len(result)} months of data')
    print(f'   Revenue models need at least 12 different months')
    print(f'   You need {12 - len(result)} more months of approved revenue data')
else:
    print(f'✓ SUFFICIENT DATA: You have {len(result)} months of data')
    print('  Revenue training should work!')

db.close()
