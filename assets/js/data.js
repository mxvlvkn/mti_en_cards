/**
 * Учебный контент. Правьте этот файл, чтобы добавить свои колоды и карточки.
 * Структура карточки:
 *   id       — уникальный (используется в прогрессе, не меняйте после старта)
 *   en       — слово или фраза
 *   ru       — перевод
 *   ipa      — транскрипция без слэшей (необязательно)
 *   pos      — часть речи (необязательно)
 *   example  — пример на английском
 *   exampleRu— перевод примера (необязательно)
 */

export const DECKS = [
  {
    id: 'everyday',
    title: 'Повседневное',
    subtitle: 'Слова, которые нужны каждый день',
    level: 'A1',
    icon: 'i-spark',
    color: '#1d7a62',
    cards: [
      { id: 'ev-01', en: 'breakfast', ru: 'завтрак', ipa: 'ˈbrekfəst', pos: 'сущ.', example: 'I have breakfast at seven.', exampleRu: 'Я завтракаю в семь.' },
      { id: 'ev-02', en: 'weather', ru: 'погода', ipa: 'ˈweðə', pos: 'сущ.', example: 'The weather is lovely today.', exampleRu: 'Сегодня прекрасная погода.' },
      { id: 'ev-03', en: 'neighbour', ru: 'сосед', ipa: 'ˈneɪbə', pos: 'сущ.', example: 'Our neighbour waters the flowers every morning.', exampleRu: 'Наш сосед поливает цветы каждое утро.' },
      { id: 'ev-04', en: 'borrow', ru: 'брать на время', ipa: 'ˈbɒrəʊ', pos: 'гл.', example: 'Can I borrow your pen for a minute?', exampleRu: 'Можно одолжить у тебя ручку на минуту?' },
      { id: 'ev-05', en: 'remember', ru: 'помнить', ipa: 'rɪˈmembə', pos: 'гл.', example: "I can't remember his name.", exampleRu: 'Не могу вспомнить его имя.' },
      { id: 'ev-06', en: 'early', ru: 'ранний, рано', ipa: 'ˈɜːli', pos: 'прил.', example: 'She leaves early to avoid the traffic.', exampleRu: 'Она выходит рано, чтобы избежать пробок.' },
      { id: 'ev-07', en: 'quiet', ru: 'тихий', ipa: 'ˈkwaɪət', pos: 'прил.', example: 'The street is very quiet at night.', exampleRu: 'Ночью на улице очень тихо.' },
      { id: 'ev-08', en: 'choose', ru: 'выбирать', ipa: 'tʃuːz', pos: 'гл.', example: 'Choose the card that fits your level.', exampleRu: 'Выбери карточку по своему уровню.' },
      { id: 'ev-09', en: 'cheap', ru: 'дешёвый', ipa: 'tʃiːp', pos: 'прил.', example: 'This coffee is cheap but good.', exampleRu: 'Этот кофе дешёвый, но хороший.' },
      { id: 'ev-10', en: 'arrive', ru: 'прибывать', ipa: 'əˈraɪv', pos: 'гл.', example: 'We arrive at nine in the morning.', exampleRu: 'Мы приезжаем в девять утра.' },
      { id: 'ev-11', en: 'lonely', ru: 'одинокий', ipa: 'ˈləʊnli', pos: 'прил.', example: 'He felt lonely in the new city.', exampleRu: 'В новом городе он чувствовал себя одиноким.' },
      { id: 'ev-12', en: 'tidy', ru: 'аккуратный; убирать', ipa: 'ˈtaɪdi', pos: 'прил./гл.', example: 'Please tidy your desk before you leave.', exampleRu: 'Пожалуйста, убери стол перед уходом.' },
      { id: 'ev-13', en: 'seldom', ru: 'редко', ipa: 'ˈseldəm', pos: 'нар.', example: 'I seldom watch TV in the evening.', exampleRu: 'Я редко смотрю телевизор вечером.' },
      { id: 'ev-14', en: 'lend', ru: 'давать в долг', ipa: 'lend', pos: 'гл.', example: 'Could you lend me your umbrella?', exampleRu: 'Можешь одолжить мне зонт?' },
      { id: 'ev-15', en: 'nearly', ru: 'почти', ipa: 'ˈnɪəli', pos: 'нар.', example: "It's nearly eight o'clock.", exampleRu: 'Почти восемь.' },
      { id: 'ev-16', en: 'advice', ru: 'совет', ipa: 'ədˈvaɪs', pos: 'сущ.', example: "That was the best advice I've ever got.", exampleRu: 'Это был лучший совет, который я получал.' }
    ]
  },
  {
    id: 'travel',
    title: 'Путешествия',
    subtitle: 'Аэропорт, отель, город',
    level: 'A2',
    icon: 'i-arrow',
    color: '#2f6db5',
    cards: [
      { id: 'tr-01', en: 'departure', ru: 'отправление', ipa: 'dɪˈpɑːtʃə', pos: 'сущ.', example: 'The departure is delayed by an hour.', exampleRu: 'Отправление задержано на час.' },
      { id: 'tr-02', en: 'luggage', ru: 'багаж', ipa: 'ˈlʌɡɪdʒ', pos: 'сущ.', example: "My luggage didn't arrive with the plane.", exampleRu: 'Мой багаж не прилетел вместе с самолётом.' },
      { id: 'tr-03', en: 'boarding pass', ru: 'посадочный талон', ipa: 'ˈbɔːdɪŋ pɑːs', pos: 'сущ.', example: 'Show your boarding pass at the gate.', exampleRu: 'Покажите посадочный талон у выхода на посадку.' },
      { id: 'tr-04', en: 'delay', ru: 'задержка; задерживать', ipa: 'dɪˈleɪ', pos: 'сущ./гл.', example: 'The flight delay ruined our plans.', exampleRu: 'Задержка рейса испортила наши планы.' },
      { id: 'tr-05', en: 'book', ru: 'бронировать', ipa: 'bʊk', pos: 'гл.', example: 'I booked a table for two.', exampleRu: 'Я забронировал столик на двоих.' },
      { id: 'tr-06', en: 'refund', ru: 'возврат денег', ipa: 'ˈriːfʌnd', pos: 'сущ.', example: 'Can I get a refund for this ticket?', exampleRu: 'Могу я вернуть деньги за этот билет?' },
      { id: 'tr-07', en: 'queue', ru: 'очередь', ipa: 'kjuː', pos: 'сущ.', example: 'There was a long queue at passport control.', exampleRu: 'На паспортном контроле была длинная очередь.' },
      { id: 'tr-08', en: 'aisle', ru: 'проход', ipa: 'aɪl', pos: 'сущ.', example: "I'd like an aisle seat, please.", exampleRu: 'Я бы хотел место у прохода, пожалуйста.' },
      { id: 'tr-09', en: 'customs', ru: 'таможня', ipa: 'ˈkʌstəmz', pos: 'сущ.', example: 'We went through customs quickly.', exampleRu: 'Мы быстро прошли таможню.' },
      { id: 'tr-10', en: 'sightseeing', ru: 'осмотр достопримечательностей', ipa: 'ˈsaɪtsiːɪŋ', pos: 'сущ.', example: 'We spent the day sightseeing.', exampleRu: 'Мы провели день за осмотром достопримечательностей.' },
      { id: 'tr-11', en: 'crowded', ru: 'переполненный', ipa: 'ˈkraʊdɪd', pos: 'прил.', example: 'The station was crowded with tourists.', exampleRu: 'Вокзал был переполнен туристами.' },
      { id: 'tr-12', en: 'itinerary', ru: 'маршрут поездки', ipa: 'aɪˈtɪnərəri', pos: 'сущ.', example: 'Our itinerary includes three cities.', exampleRu: 'Наш маршрут включает три города.' },
      { id: 'tr-13', en: 'destination', ru: 'пункт назначения', ipa: 'ˌdestɪˈneɪʃn', pos: 'сущ.', example: 'Barcelona is a popular destination.', exampleRu: 'Барселона — популярное направление.' },
      { id: 'tr-14', en: 'souvenir', ru: 'сувенир', ipa: 'ˌsuːvəˈnɪə', pos: 'сущ.', example: 'I bought a small souvenir for my sister.', exampleRu: 'Я купил маленький сувенир сестре.' },
      { id: 'tr-15', en: 'insurance', ru: 'страховка', ipa: 'ɪnˈʃʊərəns', pos: 'сущ.', example: 'Travel insurance is not included.', exampleRu: 'Страховка путешественника не включена.' },
      { id: 'tr-16', en: 'commute', ru: 'ездить на работу', ipa: 'kəˈmjuːt', pos: 'гл.', example: 'I commute by train every day.', exampleRu: 'Я каждый день езжу на работу на электричке.' }
    ]
  },
  {
    id: 'work',
    title: 'Работа и учёба',
    subtitle: 'Офис, дедлайны, встречи',
    level: 'B1',
    icon: 'i-cards',
    color: '#a2681a',
    cards: [
      { id: 'wk-01', en: 'deadline', ru: 'срок сдачи', ipa: 'ˈdedlaɪn', pos: 'сущ.', example: 'The deadline is Friday at noon.', exampleRu: 'Срок сдачи — пятница, полдень.' },
      { id: 'wk-02', en: 'schedule', ru: 'расписание', ipa: 'ˈʃedjuːl', pos: 'сущ.', example: 'My schedule is full this week.', exampleRu: 'На этой неделе у меня плотное расписание.' },
      { id: 'wk-03', en: 'colleague', ru: 'коллега', ipa: 'ˈkɒliːɡ', pos: 'сущ.', example: 'My colleague helps me with reports.', exampleRu: 'Коллега помогает мне с отчётами.' },
      { id: 'wk-04', en: 'negotiate', ru: 'вести переговоры', ipa: 'nɪˈɡəʊʃieɪt', pos: 'гл.', example: 'We negotiated a better price.', exampleRu: 'Мы договорились о лучшей цене.' },
      { id: 'wk-05', en: 'feedback', ru: 'обратная связь', ipa: 'ˈfiːdbæk', pos: 'сущ.', example: 'Thanks for the honest feedback.', exampleRu: 'Спасибо за честную обратную связь.' },
      { id: 'wk-06', en: 'achieve', ru: 'достигать', ipa: 'əˈtʃiːv', pos: 'гл.', example: 'She achieved her goal in a year.', exampleRu: 'Она достигла цели за год.' },
      { id: 'wk-07', en: 'improve', ru: 'улучшать', ipa: 'ɪmˈpruːv', pos: 'гл.', example: 'I want to improve my pronunciation.', exampleRu: 'Я хочу улучшить произношение.' },
      { id: 'wk-08', en: 'apply', ru: 'подавать заявку', ipa: 'əˈplaɪ', pos: 'гл.', example: 'I applied for a new position.', exampleRu: 'Я подал заявку на новую должность.' },
      { id: 'wk-09', en: 'responsible', ru: 'ответственный', ipa: 'rɪˈspɒnsəbl', pos: 'прил.', example: 'He is responsible for the budget.', exampleRu: 'Он отвечает за бюджет.' },
      { id: 'wk-10', en: 'procrastinate', ru: 'откладывать на потом', ipa: 'prəˈkræstɪneɪt', pos: 'гл.', example: 'Stop procrastinating and start the task.', exampleRu: 'Хватит откладывать — начинай задачу.' },
      { id: 'wk-11', en: 'efficient', ru: 'эффективный', ipa: 'ɪˈfɪʃnt', pos: 'прил.', example: 'This method is faster and more efficient.', exampleRu: 'Этот метод быстрее и эффективнее.' },
      { id: 'wk-12', en: 'clarify', ru: 'уточнять', ipa: 'ˈklærəfaɪ', pos: 'гл.', example: 'Could you clarify the last point?', exampleRu: 'Можете уточнить последний пункт?' },
      { id: 'wk-13', en: 'overtime', ru: 'сверхурочные', ipa: 'ˈəʊvətaɪm', pos: 'сущ.', example: 'I worked overtime three days this week.', exampleRu: 'На этой неделе я три дня работал сверхурочно.' },
      { id: 'wk-14', en: 'workload', ru: 'нагрузка', ipa: 'ˈwɜːkləʊd', pos: 'сущ.', example: 'My workload doubled after the launch.', exampleRu: 'После запуска моя нагрузка удвоилась.' },
      { id: 'wk-15', en: 'meeting', ru: 'встреча', ipa: 'ˈmiːtɪŋ', pos: 'сущ.', example: 'The meeting starts in ten minutes.', exampleRu: 'Встреча начинается через десять минут.' },
      { id: 'wk-16', en: 'skill', ru: 'навык', ipa: 'skɪl', pos: 'сущ.', example: 'Speaking is a skill you can train.', exampleRu: 'Говорение — навык, который можно тренировать.' }
    ]
  },
  {
    id: 'phrasal',
    title: 'Фразовые глаголы',
    subtitle: 'Глагол + предлог, которые звучат по-английски',
    level: 'B2',
    icon: 'i-bolt',
    color: '#8a4bb5',
    cards: [
      { id: 'ph-01', en: 'give up', ru: 'сдаваться', ipa: 'ɡɪv ʌp', pos: 'фраз. гл.', example: "Don't give up after one mistake.", exampleRu: 'Не сдавайся после одной ошибки.' },
      { id: 'ph-02', en: 'figure out', ru: 'понимать, разбираться', ipa: 'ˈfɪɡər aʊt', pos: 'фраз. гл.', example: "I can't figure out this rule.", exampleRu: 'Не могу разобраться в этом правиле.' },
      { id: 'ph-03', en: 'look forward to', ru: 'с нетерпением ждать', ipa: 'lʊk ˈfɔːwəd tuː', pos: 'фраз. гл.', example: 'I look forward to your reply.', exampleRu: 'С нетерпением жду вашего ответа.' },
      { id: 'ph-04', en: 'put off', ru: 'откладывать', ipa: 'pʊt ɒf', pos: 'фраз. гл.', example: 'We put off the meeting until Monday.', exampleRu: 'Мы отложили встречу до понедельника.' },
      { id: 'ph-05', en: 'come up with', ru: 'придумывать', ipa: 'kʌm ʌp wɪð', pos: 'фраз. гл.', example: 'She came up with a great idea.', exampleRu: 'Она придумала отличную идею.' },
      { id: 'ph-06', en: 'run out of', ru: 'заканчиваться', ipa: 'rʌn aʊt ɒv', pos: 'фраз. гл.', example: "We've run out of coffee.", exampleRu: 'У нас закончился кофе.' },
      { id: 'ph-07', en: 'take after', ru: 'быть похожим на родственника', ipa: 'teɪk ˈɑːftə', pos: 'фраз. гл.', example: 'He takes after his father.', exampleRu: 'Он похож на отца.' },
      { id: 'ph-08', en: 'turn down', ru: 'отклонять', ipa: 'tɜːn daʊn', pos: 'фраз. гл.', example: 'They turned down our offer.', exampleRu: 'Они отклонили наше предложение.' },
      { id: 'ph-09', en: 'bring up', ru: 'воспитывать; поднимать тему', ipa: 'brɪŋ ʌp', pos: 'фраз. гл.', example: 'She brought up three children.', exampleRu: 'Она воспитала троих детей.' },
      { id: 'ph-10', en: 'get along with', ru: 'ладить', ipa: 'ɡet əˈlɒŋ wɪð', pos: 'фраз. гл.', example: 'I get along with my neighbours.', exampleRu: 'Я лажу с соседями.' },
      { id: 'ph-11', en: 'break down', ru: 'ломаться', ipa: 'breɪk daʊn', pos: 'фраз. гл.', example: 'My car broke down on the highway.', exampleRu: 'Моя машина сломалась на трассе.' },
      { id: 'ph-12', en: 'catch up', ru: 'догонять; наверстывать', ipa: 'kætʃ ʌp', pos: 'фраз. гл.', example: "Go ahead, I'll catch up with you.", exampleRu: 'Иди вперёд, я тебя догоню.' },
      { id: 'ph-13', en: 'carry on', ru: 'продолжать', ipa: 'ˈkæri ɒn', pos: 'фраз. гл.', example: 'Carry on with your work.', exampleRu: 'Продолжай свою работу.' },
      { id: 'ph-14', en: 'look up', ru: 'искать информацию', ipa: 'lʊk ʌp', pos: 'фраз. гл.', example: 'Look up the word in a dictionary.', exampleRu: 'Посмотри слово в словаре.' },
      { id: 'ph-15', en: 'show up', ru: 'появляться', ipa: 'ʃəʊ ʌp', pos: 'фраз. гл.', example: 'He showed up an hour late.', exampleRu: 'Он появился на час позже.' },
      { id: 'ph-16', en: 'work out', ru: 'тренироваться; решаться', ipa: 'wɜːk aʊt', pos: 'фраз. гл.', example: 'Everything worked out in the end.', exampleRu: 'В итоге всё решилось.' }
    ]
  }
];

export const ALL_CARDS = DECKS.flatMap((deck) =>
  deck.cards.map((card) => ({ ...card, deckId: deck.id }))
);

const cardIndex = new Map(ALL_CARDS.map((card) => [card.id, card]));

export function getDeck(deckId) {
  return DECKS.find((deck) => deck.id === deckId) || null;
}

export function getCard(cardId) {
  return cardIndex.get(cardId) || null;
}

export function deckCards(deckId) {
  const deck = getDeck(deckId);
  return deck ? deck.cards.map((card) => ({ ...card, deckId: deck.id })) : [];
}

export const TOTAL_CARDS = ALL_CARDS.length;
