import os # для работы с файлами (users.txt)
import json  # для превращения словарей в строки и обратно
import threading # чтобы слушать сообщения в фоновом режиме
from kafka import KafkaProducer, KafkaConsumer   # общение с Kafka

# тут работаем с файлом user.txt, там лежат логины и их теги
# Формат:
#   логин:тег1,тег2,тег3




# ПРО ЗАПИСЬ ТЕГОВ И ВСЁ ТАКОЕ

# смотрим из файла user.txt какие теги есть для этого логина. выводим, 
# если они есть, None - если нет
def load_user_tags(login):
    if not os.path.exists("users.txt"): # Если файла впринципе нет – создаём пустой
        open("users.txt", "w").close()

    with open("users.txt", "r") as f:
        for line in f:
            line = line.strip()
            if not line: #защита от пустых строк в файле
                continue
            # Разделяем строку на логин и часть с тегами
            stored_login, tags_str = line.split(":", 1)
            if stored_login == login: # логин найден
                # Превращаем теги в список
                tags = [tag.strip() for tag in tags_str.split(",") if tag.strip()]
                return tags
    return None   # логин не найден


# сохранение или обновление тегов для логина в файле
def save_user_tags(login, tags):
    lines = []
    # переписываем всё содержимое в список
    if os.path.exists("users.txt"):
        with open("users.txt", "r") as f:
            lines = f.readlines()
    
    with open("users.txt", "w") as f:
        updated = False # флаг, всё ли найдено и обновлено
        for line in lines:
            line = line.strip()
            if not line:
                continue
            stored_login, _ = line.split(":", 1)
            if stored_login == login:
                # обновляем строку для этого логина
                f.write(f"{login}:{','.join(tags)}\n")
                updated = True
            else: # переписываем как была, если не та строка
                f.write(line + "\n")
        if not updated:
            # если логин новый, добавляем запись в конец
            f.write(f"{login}:{','.join(tags)}\n")









# ОТПРАВКА СТАТУСА ОНЛАЙН/ОФФЛАЙН

# cоздаём одного продюсера на всю программу
producer = KafkaProducer(
    bootstrap_servers='localhost:9092', # адрес Kafka !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
    value_serializer=lambda v: json.dumps(v).encode('utf-8')  # как упаковать сообщение
)

# Отправляет в топик 'user-status' сообщение: {login: ..., status: ...}
def send_status(login, status):
    
    message = {
        "login": login,
        "status": status # 'online' или 'offline'
    }
    producer.send("user-status", value=message) #  отправляем это сообщение в топик с именем "user-status"
    producer.flush() # сразу отправляем, не ждём накопления

    # print(f"[СТАТУС] {login} -> {status}") # для отладки







# ПОДПИСКА НА СООБЩЕНИЯ ПО ОПРЕДЕЛЁННОМУ ТОПИКУ

# она создаёт потребителя (consumer) Kafka, который слушает топики,
# соответствующие тегам пользователя (например, chat.music, chat.sports),
# и выводит приходящие сообщения на экран.
def start_consumer_for_user(login, tags):
    # если не подписан ни на какие топики
    if not tags:
        print(f"[{login}] You are not subscribed to any channel. You will not receive any messages. ")
        return

    # формируем список топиков: например, ['chat.music', 'chat.sports']
    topics = [f"chat.{tag}" for tag in tags]

    # создаём объект KafkaConsumer – это клиент Kafka, который умеет читать сообщения из топиков
    consumer = KafkaConsumer(
        *topics, # распаковываем список
        bootstrap_servers='localhost:9092', # адрес Kafka !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
        group_id=f"user-{login}", #group_id – идентификатор группы потребителей. 
        # Kafka хранит для каждой группы позицию (offset) – какие сообщения уже прочитаны.
        # Мы делаем отдельную группу для каждого пользователя: user-alice, user-bob и т.д. 
        # Это нужно, чтобы при перезапуске программы пользователь не получал старые сообщения заново
        auto_offset_reset='earliest', # читать с самого начала (если нет сохранённой позиции)
        value_deserializer=lambda v: json.loads(v.decode('utf-8'))
    )

    # print(f"[{login}] Подписался на топики: {topics}") # для отладки


    # бесконечно получает сообщения и выводит их на экран
    def consume_forever():
        try:
            for msg in consumer: # бесконечный цикл, конструкция consumer
                # ведёт себя как итератор: каждую итерацию она ждёт следующее сообщение из Kafka
                # и кладёт его в переменную msg
                print(f"\n[→ {login}] Новое сообщение из {msg.topic}: {msg.value}")
        except KeyboardInterrupt:
            pass
        finally: # этот блок выполнится в любом случае: и при нормальном завершении цикла 
            # (почти никогда), и при ошибке, и при Ctrl+C.
            consumer.close()

    # запускаем функцию consume_forever в фоновом потоке, чтобы программа не зависла
    thread = threading.Thread(target=consume_forever, daemon=True)
    thread.start()








# ЗАЛОГИНИВАНИЕ 
# тут надо поменять текста сообщений пользователю, я дефолтные понаписала


def login():
    print("HI") # просто приветствие для пользователя, можно изменить
    login_name = input("Enter your username: ").strip()
    if not login_name:
        print("The username cannot be empty")
        return

    # загружаем теги из файла
    tags = load_user_tags(login_name)
    if tags is None:
        # новый пользователь – создаём запись с пустыми тегами
        print(f"New user {login_name}. Creating an entry.")
        tags = []
        save_user_tags(login_name, tags)
    else:
        print(f"Welcome back, {login_name}! Your tags: {tags}")

    # отправляем статус ONLINE
    send_status(login_name, "online")

    # запускаем подписку на сообщения по тегам
    start_consumer_for_user(login_name, tags)

    # ждём, пока пользователь не захочет выйти
    print("\nTo exit, press Enter")
    input()   # программа остановится здесь до нажатия Enter

    # отправляем статус OFFLINE и закрываем продюсера
    send_status(login_name, "offline")
    producer.close()
    print("Goodbye!")




if __name__ == "__main__":
    login()




