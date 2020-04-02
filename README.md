# KYFW
a rhino-javascript chatbot framework

### Prerequisites

```
MessengerBot R with API LEVEL 2 / BABELjs
```

## Documentation

### msg keys

```js
{
    "_id": int, //chat_logs column key
    "id": bigInt, //chat uid
    "type": int, //chat type
    "chat_id": bigInt, //room uid
    "user_id": bigInt, //user uid
    "message": "str", //message string
    "attachment": various, //chat attachment data of special type msg
    "created_at": int, //unix timestamp
    "deleted_at": int, //unix timestamp, if not deleted: 0
    "client_message_id": int, //????
    "prev_id": bigInt, //user's previous chat uid ??
    "referer": "0", //????
    "supplement": "null", //????
    "v": {
        "notDecoded": false,
        "origin": "MCHATLOGS",
        "c": "00-00 00:00:00", //created_at => string
        "isSingleDefaultEmoticon": false,
        "defaultEmoticonsCount": 0,
        "isMine": boolean, //
        "enc": int //enc type
    }
}
```

### msg types

#### 0: line-type notice (ex. 입/퇴장, 가리기)
```js
{
    "type": 0,
    "message": {
        "feedType": 4,
        "members": [{
            "userId": int,
            "nickName": "str"
        }]
        },
    "attachment": null
}
```
```js
{
    "type": 0,
    "message": {
        "feedType": 13,
        "members": [{
            "logId": bigInt, //????
            "type": 1
        }]
        },
    "attachment": null,
}
```
```js
{
    "type": 0,
    "message": {
        "feedType": 13,
        "members": [{
            "logId": bigInt, //????
            "type": 1
        }]
        },
    "attachment": null,
    "v": {
        "origin": "MSG",
        "previous_message": "str",
        "previous_enc": int
    }
}
```

#### 1: text
```js
{
    "type": 1,
    "message": "str",
    "attachment": ""
}
```
2: photo "사진"
3: video "동영상"
4: contact "연락처"
5: voice "음성메시지"
6: emoticon "(이모티콘)" (animated gif)
12: emoticon(png)
14: vote?
16: location
17: profile
18: long text ????
20: emoticon(webp) ????
22: emoticon? ????
23: #search (샵검색)
24: notice?
25: emotice(webp)?
26: reply (답장)
27: photo group (사진 묶어보내기)
71: ???? (긴 텍스트 일종??)
96: 일정?? (일정 임박시 알림??)
97: 투표?? (투표종료시 출력??)
98: notice (공지 공유)
16384+(int): deleted type[int]
