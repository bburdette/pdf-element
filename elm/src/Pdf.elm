module Pdf exposing
    ( PdfCmd(..)
    , PdfMsg(..)
    , decodeMsg
    , encodeCmd
    , receive
    , send
    )

{-| This Pdf Elm module lets you encode and decode messages to pass to javascript,
where the actual websocket sending and receiving will take place. See the README for more.

@docs PdfCmd
@docs PdfMsg
@docs decodeMsg
@docs encodeCmd
@docs receive
@docs send

-}

import Json.Decode as JD
import Json.Encode as JE


{-| use send to make a websocket convenience function,
like so:

      port sendPdfCommand : JE.Value -> Cmd msg

      wssend =
          Pdf.send sendPdfCommand

then you can call (makes a Cmd):

      wssend <|
          Pdf.Send
              { name = "touchpage"
              , content = dta
              }

-}
send : (JE.Value -> Cmd msg) -> PdfCmd -> Cmd msg
send portfn wsc =
    portfn (encodeCmd wsc)


{-| make a subscription function with receive and a port, like so:

      port receiveSocketMsg : (JD.Value -> msg) -> Sub msg

      wsreceive =
          receiveSocketMsg <| Pdf.receive WsMsg

Where WsMessage is defined in your app like this:

      type Msg
          = WsMsg (Result JD.Error Pdf.PdfMsg)
          | <other message types>

then in your application subscriptions:

      subscriptions =
          \_ -> wsreceive

-}
receive : (Result JD.Error PdfMsg -> msg) -> (JD.Value -> msg)
receive wsmMsg =
    \v ->
        JD.decodeValue decodeMsg v
            |> wsmMsg


{-| PdfCmds go from from elm out to javascript to be processed.

  - name: You should give each websocket connection a unique name.
  - address: is the websocket address, for instance "<ws://127.0.0.1:9000">.
  - protocol: is an extra string to help the server know what kind of data to expect, like
    if your server handled either json or binary data. Probably you can just pass it "".
  - content: the data you're sending through the socket.

-}
type PdfCmd
    = Open { name : String, url : String }
    | Close { name : String }


{-| PdfMsgs are responses from javascript to elm after websocket operations.
The name should be the same string you used in Connect.
-}
type PdfMsg
    = Error { name : String, error : String }
    | DocId { name : String, id : String }


{-| encode websocket commands into json.
-}
encodeCmd : PdfCmd -> JE.Value
encodeCmd cmd =
    case cmd of
        Open msg ->
            JE.object
                [ ( "cmd", JE.string "open" )
                , ( "name", JE.string msg.name )
                , ( "url", JE.string msg.url )
                ]

        Close msg ->
            JE.object
                [ ( "cmd", JE.string "close" )
                , ( "name", JE.string msg.name )
                ]


{-| decode incoming messages from the websocket javascript.
-}
decodeMsg : JD.Decoder PdfMsg
decodeMsg =
    JD.field "msg" JD.string
        |> JD.andThen
            (\msg ->
                case msg of
                    "error" ->
                        JD.map2 (\a b -> Error { name = a, error = b })
                            (JD.field "name" JD.string)
                            (JD.field "error" JD.string)

                    "docId" ->
                        JD.map2 (\a b -> DocId { name = a, id = b })
                            (JD.field "name" JD.string)
                            (JD.field "id" JD.string)

                    unk ->
                        JD.fail <| "unknown websocketmsg type: " ++ unk
            )
