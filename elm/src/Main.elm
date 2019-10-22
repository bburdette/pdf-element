module Main exposing (..)

import Element as E
import Element.Border as EB
import Html exposing (Html)
import Html.Attributes as HA


main : Html ()
main =
    E.layout
        []
    <|
        E.column []
            [ E.text "greetings from elm"
            , E.el [ EB.width 5 ] <|
                E.html <|
                    Html.canvas [ HA.id "elm-canvas" ]
                        []
            , E.text "look at my pdf"
            ]
