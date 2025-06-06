import environ
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False)
)

# Read the .env file
environ.Env.read_env(BASE_DIR / '.env')

# Dabase configuration for supabase
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env.db()['NAME'],
        'USER': env.db()['USER'],
        'PASSWORD': env.db()['PASSWORD'],
        'HOST': env.db()['HOST'],
        'PORT': env.db()['PORT'],
        'OPTIONS': {
            'sslmode': 'require',  # Required for Supabase
        },
    }
}