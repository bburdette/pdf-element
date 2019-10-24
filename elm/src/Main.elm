port module Main exposing (..)

import Browser as B
import Element as E
import Element.Border as EB
import Element.Input as EI
import Html exposing (Html)
import Html.Attributes as HA
import Json.Decode as JD
import Json.Encode as JE
import Pdf


type alias Model =
    { show : Bool
    , pdfId : Maybe String
    }


type Msg
    = ShowHide
    | Render
    | PdfMsg (Result JD.Error Pdf.PdfMsg)


port render : JE.Value -> Cmd msg


port sendPdfCommand : JE.Value -> Cmd msg


port receivePdfMsg : (JD.Value -> msg) -> Sub msg


pdfreceive : Sub Msg
pdfreceive =
    receivePdfMsg <| Pdf.receive PdfMsg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ShowHide ->
            ( { model | show = not model.show }, Cmd.none )

        Render ->
            ( model, render JE.null )

        PdfMsg _ ->
            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    E.layout
        []
    <|
        E.column []
            [ E.text "greetings from elm"
            , EI.button [] { label = E.text "show/hide", onPress = Just ShowHide }
            , EI.button [] { label = E.text "render", onPress = Just Render }
            , if model.show then
                E.el [ EB.width 5 ] <|
                    E.html <|
                        Html.canvas [ HA.id "elm-canvas" ]
                            []

              else
                E.none
            , E.text "look at my pdf"
            ]


type alias Flags =
    ()


init : Flags -> ( Model, Cmd Msg )
init _ =
    ( { show = True, pdfId = Nothing }, Cmd.none )


main =
    B.element
        { init = init
        , subscriptions = \_ -> Sub.none
        , view = view
        , update = update
        }
