import os
import sys
from pathlib import Path
from django.core.wsgi import get_wsgi_application

# ESTO ES VITAL PARA QUE EL SERVIDOR NO TRUENE
path_to_backend = Path(__file__).resolve().parent.parent
if str(path_to_backend) not in sys.path:
    sys.path.append(str(path_to_backend))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'spotter_backend.settings')

application = get_wsgi_application()