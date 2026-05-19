from celery import Celery
celery = Celery(
    "tasks",
    broker = "redis://localhost:6379/0"
)

@celery.tasks
def process_video_task(url):
    pass