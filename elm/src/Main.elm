port module Main exposing (..)

import Browser as B
import Element as E exposing (Element)
import Element.Background as EBg
import Element.Border as EB
import Element.Font as EF
import Element.Input as EI
import File exposing (File)
import File.Select as FS
import Html exposing (Html)
import Html.Attributes as HA
import Json.Decode as JD
import Json.Encode as JE
import Pdf
import Task


type alias Model =
    { show : Bool
    , pdfName : Maybe String
    , zoom : Float
    , zoomText : String
    , page : Int
    , pageCount : Maybe Int
    }


type Msg
    = OpenClick
    | PrevPage
    | NextPage
    | PdfOpened File
    | ZoomChanged String
    | PdfExtracted String String
    | PdfMsg (Result JD.Error Pdf.PdfMsg)


port sendPdfCommand : JE.Value -> Cmd msg


pdfsend : Pdf.PdfCmd -> Cmd Msg
pdfsend =
    Pdf.send sendPdfCommand


port receivePdfMsg : (JD.Value -> msg) -> Sub msg


pdfreceive : Sub Msg
pdfreceive =
    receivePdfMsg <| Pdf.receive PdfMsg


buttonStyle : List (E.Attribute msg)
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
        OpenClick ->
            ( model, FS.file [ "application/pdf" ] PdfOpened )

        PdfOpened file ->
            ( model, Task.perform (PdfExtracted (File.name file)) (File.toUrl file) )

        PdfExtracted name string ->
            case String.split "base64," string of
                [ a, b ] ->
                    ( { model | page = 1 }, pdfsend <| Pdf.OpenString { name = name, string = b } )

                _ ->
                    ( model, Cmd.none )

        ZoomChanged string ->
            ( { model
                | zoomText = string
                , zoom = String.toFloat string |> Maybe.withDefault model.zoom
              }
            , Cmd.none
            )

        PdfMsg ms ->
            let
                _ =
                    Debug.log "pdfmsg: " ms
            in
            case ms of
                Ok (Pdf.Loaded lm) ->
                    ( { model
                        | pdfName = Just lm.name
                        , pageCount = Just lm.pageCount
                      }
                    , Cmd.none
                    )

                Ok (Pdf.Error e) ->
                    ( model, Cmd.none )

                Err e ->
                    ( model, Cmd.none )

        PrevPage ->
            if model.page > 1 then
                ( { model | page = model.page - 1 }, Cmd.none )

            else
                ( model, Cmd.none )

        NextPage ->
            case model.pageCount of
                Just pc ->
                    if model.page < pc then
                        ( { model | page = model.page + 1 }, Cmd.none )

                    else
                        ( model, Cmd.none )

                Nothing ->
                    ( model, Cmd.none )


topBar : Model -> Element Msg
topBar model =
    E.row [ E.width E.fill, EBg.color <| E.rgb 0.4 0.4 0.4, E.spacing 5, E.paddingXY 5 5 ]
        [ EI.button buttonStyle { label = E.text "open pdf", onPress = Just OpenClick }
        , E.el [ E.width E.shrink ] <|
            EI.text [ E.width <| E.px 100 ]
                { onChange = ZoomChanged
                , text = model.zoomText
                , placeholder = Nothing
                , label = EI.labelLeft [ EF.color <| E.rgb 1 1 1, E.centerY ] <| E.text "zoom"
                }
        , case model.pdfName of
            Just name ->
                E.el [ E.centerX ] <| E.text name

            Nothing ->
                E.none
        , E.el [ EF.color <| E.rgb 1 1 1 ] <|
            E.text <|
                "Page: "
                    ++ String.fromInt model.page
                    ++ " of "
                    ++ (model.pageCount
                            |> Maybe.map String.fromInt
                            |> Maybe.withDefault "?"
                       )
        , EI.button buttonStyle { label = E.text "prev", onPress = Just PrevPage }
        , EI.button buttonStyle { label = E.text "next", onPress = Just NextPage }
        ]


view : Model -> Html Msg
view model =
    E.layout
        [ E.inFront <| topBar model ]
    <|
        E.column [ E.spacing 5, E.width E.fill, E.alignTop ]
            [ E.el [ E.transparent True ] <| topBar model
            , case model.pdfName of
                Just name ->
                    if model.show then
                        E.row [ E.width E.fill, E.alignTop ]
                            [ E.column
                                [ E.width E.fill
                                , E.height E.fill
                                , E.alignTop
                                , E.paddingXY 5 0
                                ]
                                [ E.el
                                    [ E.width E.shrink
                                    , E.centerX
                                    , EB.width 5
                                    , E.alignTop
                                    ]
                                  <|
                                    E.html <|
                                        Pdf.pdfPage name model.page model.zoom
                                ]
                            ]

                    else
                        E.none

                Nothing ->
                    E.none
            ]


type alias Flags =
    ()


init : Flags -> ( Model, Cmd Msg )
init _ =
    ( { show = True
      , pdfName = Nothing
      , zoom = 1.0
      , zoomText = "1.0"
      , page = 1
      , pageCount = Nothing
      }
    , Cmd.none
    )


main : Program Flags Model Msg
main =
    B.element
        { init = init
        , subscriptions = \_ -> pdfreceive
        , view = view
        , update = update
        }
