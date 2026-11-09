import shutil
from datetime import datetime
import os
ts = datetime.now().strftime('%Y%m%d_%H%M%S')
shutil.copy('db.sqlite3', os.path.join('backups', f'db_{ts}.sqlite3'))
print('Backup creado')
