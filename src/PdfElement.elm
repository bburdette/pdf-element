module PdfElement exposing
    ( pdfPage
    , PdfDims(..)
    , PdfCmd(..)
    , PdfMsg(..)
    , receive
    , send
    , decodeMsg
    , encodeCmd
    )

{-| This Elm module contains the necessary machinery for communicating with javascript,
where the actual pdf wrangling will take place. Use the Cmds to open and close documents,
listen for Msgs indicating the Cmd results, and display the document pages with pdfPage.

@docs pdfPage
@docs PdfDims
@docs PdfCmd
@docs PdfMsg
@docs receive
@docs send
@docs decodeMsg
@docs encodeCmd

-}

import Html exposing (Html)
import Html.Attributes as HA
import Html.Keyed as HK
import Json.Decode as JD
import Json.Encode as JE


{-| pdfPage makes a 'custom element' that displays the pdf for the document indicated by
'name'. Before calling this function, you should open the document with a PdfCmd and
wait for a Loaded msg.
-}
pdfPage : String -> Int -> PdfDims -> Html msg
pdfPage name page pd =
    -- use a keyed node to force refresh when parameters change.
    HK.node "span"
        []
        [ ( name ++ String.fromInt page ++ pdToString pd
          , Html.node "pdf-element"
                ([ HA.attribute "name" name
                 , HA.attribute "page" (String.fromInt page)
                 ]
                    ++ pdToAttribs pd
                )
                []
          )
        ]


{-| Specify the size of the pdf document. If you specify height or width, the scale will
be computed to fit.
-}
type PdfDims
    = Scale Float
    | Width Int
    | Height Int
    | WidthHeight Int Int


pdToString : PdfDims -> String
pdToString pd =
    case pd of
        Scale s ->
            "Scale" ++ String.fromFloat s

        Width w ->
            "Width" ++ String.fromInt w

        Height h ->
            "Height" ++ String.fromInt h

        WidthHeight w h ->
            "WidthHeight" ++ String.fromInt w ++ "," ++ String.fromInt h


pdToAttribs : PdfDims -> List (Html.Attribute msg)
pdToAttribs pd =
    case pd of
        Scale s ->
            [ HA.attribute "scale" (String.fromFloat s) ]

        Width w ->
            [ HA.attribute "width" (String.fromInt w) ]

        Height h ->
            [ HA.attribute "height" (String.fromInt h) ]

        WidthHeight w h ->
            [ HA.attribute "width" (String.fromInt w)
            , HA.attribute "height" (String.fromInt h)
            ]


{-| use send to make a websocket convenience function,
like so:

      port sendPdfCommand : JE.Value -> Cmd msg

      pdfsend =
          PdfElement.send sendPdfCommand

then you can call (makes a Cmd):

      pdfsend <|
          PdfElement.OpenString
              { name = "mypdf"
              , string = dta
              }

-}
send : (JE.Value -> Cmd msg) -> PdfCmd -> Cmd msg
send portfn wsc =
    portfn (encodeCmd wsc)


{-| make a subscription function with receive and a port, like so:

      port receivePdfMsg : (JD.Value -> msg) -> Sub msg

      pdfreceive : Sub Msg
      pdfreceive =
          receivePdfMsg <| PdfElement.receive PdfMsg

Where PdfMessage is defined in your app like this:

      type Msg
          = PdfMsg (Result JD.Error PdfElement.PdfMsg)
          | <other message types>

then in your application subscriptions:

      subscriptions =
          \_ -> pdfreceive

-}
receive : (Result JD.Error PdfMsg -> msg) -> (JD.Value -> msg)
receive wsmMsg =
    \v ->
        JD.decodeValue decodeMsg v
            |> wsmMsg


{-| PdfCmds go from from elm out to javascript to be processed.
Each pdf document should have a unique name. You can make multiple pdfPage controls that
reference a single pdf document.
-}
type PdfCmd
    = OpenUrl { name : String, url : String }
    | OpenString { name : String, string : String }
    | Close { name : String }


{-| PdfMsgs are responses from javascript to elm after PdfCmd operations.
The name should be the same string you used in OpenUrl or OpenString.
-}
type PdfMsg
    = Error { name : String, error : String }
    | Loaded { name : String, pageCount : Int }


{-| encode websocket commands into json.
-}
encodeCmd : PdfCmd -> JE.Value
encodeCmd cmd =
    case cmd of
        OpenUrl msg ->
            JE.object
                [ ( "cmd", JE.string "openurl" )
                , ( "name", JE.string msg.name )
                , ( "url", JE.string msg.url )
                ]

        OpenString msg ->
            JE.object
                [ ( "cmd", JE.string "openstring" )
                , ( "name", JE.string msg.name )
                , ( "string", JE.string msg.string )
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

                    "loaded" ->
                        JD.map2 (\a b -> Loaded { name = a, pageCount = b })
                            (JD.field "name" JD.string)
                            (JD.field "pageCount" JD.int)

                    unk ->
                        JD.fail <| "unknown websocketmsg type: " ++ unk
            )
