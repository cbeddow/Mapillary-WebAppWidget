/* globals dojo, define, esri, Point */

define([
        'esri/geometry/Point',
        'dojo/_base/declare',
        'dojo/_base/lang',
        'jimu/BaseWidget',
        'esri/geometry/Extent',
        'esri/SpatialReference',
        './mapillary-js.min',
        'esri/layers/VectorTileLayer',
        'esri/geometry/webMercatorUtils',
        'esri/geometry/screenUtils',
        'jimu/LayerInfos/LayerInfos',
        './ramda.min',
        'dojo/parser',
        'dijit/TooltipDialog',
        'dijit/form/CheckBox',
        'dijit/form/Button',
        'dijit/form/DropDownButton',
        'dojo/dom',
        'dojo/on'
       ],
       function (
                 Point,
                 declare,
                 lang,
                 BaseWidget,
                 Extent,
                 SpatialReference,
                 Mapillary,
                 VectorTileLayer,
                 webMercatorUtils,
                 screenUtils,
                 LayerInfos,
                 R,
                 parser,
                 TooltipDialog,
                 CheckBox,
                 Button,
                 DropDownButton,
                 dom,
                 on) {
         return declare([BaseWidget], {

           baseClass: 'jimu-widget-mapillary',

           /* *********
            * Widget
            * *********/

           startup: function () {
             // parse templates
             parser.parse()

             // Bootstrap Mapillary
             this.mapillary = new Mapillary
               .Viewer('mly',
                       'cjJ1SUtVOEMtdy11b21JM0tyYTZIQTpiNjQ0MTgzNTIzZGM2Mjhl',
                       null,
                       {
                         cover: false,
                         detection: true
                       })

             this.parentEl = this.mapillary._container.element.parentElement

             this.toggleViewerVisibility(false)

             this.attachHooks({'nodechanged': this.onNodeChanged.bind(this)},
                              this.mapillary)

             // FML
             var that = this

             on(dom.byId('save'), 'click', function (evt) {
               var mapillarysequences = dom.byId('mapillarysequences')

               that.applySettings({
                 mapillarysequences: mapillarysequences.checked
               })
             })

             // Bootstrap Map with Mapillary Layers
             this.addLayers()

             this.attachHooks({
               'click': this.onMapClick.bind(this),
               'update-end': this.onMapUpdateEnd.bind(this)
             }, this.map)
             // End of startup
           },

           /* *********
            * Mapillary
            * *********/

           // Handles `onnodechanged` event
           onNodeChanged: function (node) {
             var lon = node.latLon.lon
             var lat = node.latLon.lat
             var diff = 0.001

             this.map.graphics.clear()
             this.toggleViewerVisibility(true)

             var pt = new Point(lon, lat, new esri.SpatialReference({ 'wkid': 4326 }))
             this.map.graphics.add(new esri.Graphic(
               esri.geometry.geographicToWebMercator(pt),
               new esri.symbol.SimpleMarkerSymbol(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND, 10),
               { 'title': node.latLon.lon + ' ' + node.latLon.lat, 'content': 'A Mapillary Node' },
               new esri.InfoTemplate('${title}', '${content}')
             ))

             // this.map.setExtent(new Extent(lon - diff, lat - diff, lon + diff, lat + diff, new SpatialReference({ wkid: 4326 })))

             var screenOffsets = screenUtils.toScreenPoint(this.map.extent, this.map.width, this.map.height, pt)

             var p = new Point(screenOffsets.x, screenOffsets.y)
           },

           /* **********
            * Map
            * *********/

           addLayers: function () {
             var s = 'mapillarysequences'
             this.map
               .addLayer(new VectorTileLayer(
                 'widgets/Mapillary-WebAppWidget/sequence_tiles.json',
                 { id: s}
               ))

             var ls = this.map.getLayer(s)
             ls.on('load', function () {
               ls.gl.style._layers[s].layout.visibility = 'none'
               ls.gl.refresh()
             })
           },

           onMapClick: function (event) {
             var mp = webMercatorUtils.webMercatorToGeographic(event.mapPoint)
             this.mapillary.moveCloseTo(mp.y, mp.x)
           },

           onMapUpdateEnd: function (event) {},

           applySettings: function (settings) {
             function applyLayerVisibility (layerPair) {
               var layer = this.map.getLayer(layerPair[0])
               if (layerPair[1]) {
                 layer.gl.style._layers[layerPair[0]].layout.visibility = 'visible'
               } else {
                 layer.gl.style._layers[layerPair[0]].layout.visibility = 'none'
               }
             }

             R.toPairs(settings).forEach(applyLayerVisibility.bind(this))
           },

           /* **********
            * Utils
            * **********/

           // Cleaner way of hooking into events for Mapillary, Map, etc.
           attachHooks: function (hooks, context) {
             function attachListener (keyValuePair) {
               context.on(keyValuePair[0], keyValuePair[1])
             }

             R.toPairs(hooks).forEach(attachListener)

             return true
           },

           toggleViewerVisibility: function (val) {
             var klaz = 'hide-viewer-content'

             if (val) {
               this.parentEl.classList.remove(klaz)
             } else {
               this.parentEl.classList.add(klaz)
             }
           }
         })
       })
