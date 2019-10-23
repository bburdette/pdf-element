module Main exposing (..)

import Browser as B
import Element as E
import Element.Border as EB
import Element.Input as EI
import Html exposing (Html)
import Html.Attributes as HA


type alias Model =
    { show : Bool }


type Msg
    = ShowHide


update : Msg -> Model -> Model
update msg model =
    case msg of
        ShowHide ->
            { model | show = not model.show }


view : Model -> Html Msg
view model =
    E.layout
        []
    <|
        E.column []
            [ E.text "greetings from elm"
            , EI.button [] { label = E.text "show/hide", onPress = Just ShowHide }
            , if model.show then
                E.el [ EB.width 5 ] <|
                    E.html <|
                        Html.canvas [ HA.id "elm-canvas" ]
                            []

              else
                E.none
            , E.text "look at my pdf"
            ]


main =
    B.sandbox
        { init = { show = True }
        , view = view
        , update = update
        }
