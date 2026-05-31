# from motor.motor_asyncio import AsyncIOMotorClient
# from datetime import datetime,timezone

# MONGO_URI="mongodb+srv://kamran:mirza123@kamran.k9xc4jr.mongodb.net/?appName=kamran"
# client = AsyncIOMotorClient(MONGO_URI)
# db = client["youtube-ai"]
# videos_collection = db["test"]
# counters_collection = db["counters"]

# async def get_next_id(name):
#     try:
#         result = await counters_collection.find_one_and_update(
#             {"_id" : name},
#             {"$inc" : {"seq" : 1}},
#             upsert=True,
#             return_document=True
#         )
#         return result["seq"]
#     except Exception as e:
#         print(f"get_next_id failed: {type(e).__name__}: {str(e)}")
#         raise

# async def save_video(url:str,title:str,summary:str):
#     try:
#         print("save video code running")
#         video={
#             "id" : await get_next_id("videos"),
#             "url" : url,
#             "title" : title,
#             "summary" : summary,
#             "created_at" : datetime.now(timezone.utc)
#         }
#         await videos_collection.insert_one(video)
#         return video
#     except Exception as e:
#         print(f"save_video failed: {type(e).__name__}: {str(e)}")
#         import traceback
#         traceback.print_exc()
#         raise

# async def test_connection():
#     try:
#         await client.admin.command("ping")
#         print("Mongodb connected successfully.")
#     except Exception as e:
#         print(e)