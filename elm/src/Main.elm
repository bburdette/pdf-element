port module Main exposing (..)

import Browser as B
import Element as E
import Element.Background as EBg
import Element.Border as EB
import Element.Font as EF
import Element.Input as EI
import Html exposing (Html)
import Html.Attributes as HA
import Json.Decode as JD
import Json.Encode as JE
import Pdf


type alias Model =
    { show : Bool
    , pdfName : Maybe String
    }


type Msg
    = ShowHide
    | Render
    | LoadClick
    | PdfMsg (Result JD.Error Pdf.PdfMsg)


port render : JE.Value -> Cmd msg


port sendPdfCommand : JE.Value -> Cmd msg


pdfsend =
    Pdf.send sendPdfCommand


port receivePdfMsg : (JD.Value -> msg) -> Sub msg


pdfreceive : Sub Msg
pdfreceive =
    receivePdfMsg <| Pdf.receive PdfMsg


url : String
url =
    "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf"


buttonStyle =
    [ EBg.color <| E.rgb 0.1 0.1 0.1
    , EF.color <| E.rgb 1 1 0
    , EB.color <| E.rgb 1 0 1
    , E.paddingXY 10 10
    , EB.rounded 3
    ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ShowHide ->
            ( { model | show = not model.show }, Cmd.none )

        Render ->
            ( model, render JE.null )

        LoadClick ->
            ( model, pdfsend <| Pdf.Open { name = "blah", url = url } )

        PdfMsg ms ->
            let
                _ =
                    Debug.log "pdfmsg: " ms
            in
            case ms of
                Ok (Pdf.Loaded lm) ->
                    ( { model | pdfName = Just lm.name }, Cmd.none )

                Ok (Pdf.Error e) ->
                    ( model, Cmd.none )

                Err e ->
                    ( model, Cmd.none )


view : Model -> Html Msg
view model =
    E.layout
        []
    <|
        E.column [ E.spacing 5 ]
            [ E.text "greetings from elm"
            , EI.button buttonStyle { label = E.text "show/hide", onPress = Just ShowHide }
            , EI.button buttonStyle { label = E.text "render", onPress = Just Render }
            , if model.show then
                E.el [ EB.width 5 ] <|
                    E.html <|
                        Html.canvas [ HA.id "elm-canvas" ]
                            []

              else
                E.none
            , E.text "look at my pdf ^"
            , case model.pdfName of
                Just name ->
                    E.column []
                        [ E.el [ E.width <| E.px 800, E.height <| E.px 800, EB.width 5 ] <|
                            E.html <|
                                Html.node "pdf-element"
                                    [ HA.attribute "name" <|
                                        Debug.log "name is: " name
                                    ]
                                    []

                        -- [ E.html <| Html.node "canvas" [ HA.attribute "name" name ] []
                        , E.text name
                        ]

                Nothing ->
                    E.none
            , EI.button buttonStyle { label = E.text "load other", onPress = Just LoadClick }
            , E.text <| "look at my other pdf ^"
            ]


type alias Flags =
    ()


init : Flags -> ( Model, Cmd Msg )
init _ =
    ( { show = True, pdfName = Nothing }, Cmd.none )


main : Program Flags Model Msg
main =
    B.element
        { init = init
        , subscriptions = \_ -> pdfreceive
        , view = view
        , update = update
        }
