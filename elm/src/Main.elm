port module Main exposing (..)

import Browser as B
import Element as E
import Element.Border as EB
import Element.Input as EI
import Html exposing (Html)
import Html.Attributes as HA
import Json.Encode as JE
import Pdf as P


type alias Model =
    { show : Bool }


type Msg
    = ShowHide
    | Render


port sendPdfCommand : JE.Value -> Cmd msg


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        ShowHide ->
            ( { model | show = not model.show }, Cmd.none )

        Render ->
            ( model, sendPdfCommand JE.null )


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
init flags =
    ( { show = True }, Cmd.none )


main =
    B.element
        { init = init
        , subscriptions = \_ -> Sub.none
        , view = view
        , update = update
        }
