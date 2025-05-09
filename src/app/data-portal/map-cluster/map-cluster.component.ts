import { Component, AfterViewInit, Input, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet.markercluster';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = iconDefault;

@Component({
  standalone: true,
  selector: 'app-mapcluster',
  templateUrl: './map-cluster.component.html',
  styleUrls: ['./map-cluster.component.css']
})
export class MapClusterComponent implements AfterViewInit {
  private map: L.Map;
  private tiles: L.Layer;
  private markers: L.MarkerClusterGroup;

  @Input('orgGeoList') orgGeoList: any;
  @Input('specGeoList') specGeoList: any;

  @ViewChild('mapContainer', { static: false }) mapContainer: ElementRef;

  constructor() { }

  ngAfterViewInit(): void {
    if (!this.orgGeoList) {
      setTimeout(() => this.initMap(), 400);
    } else {
      this.initMap();
    }
  }

  private initMap(): void {
    if (!this.mapContainer || !this.mapContainer.nativeElement) {
      console.error('Map container not found!');
      return;
    }

    this.tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      minZoom: 3,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    const latCoo = this.orgGeoList[0]?.lat;
    const lngCoo = this.orgGeoList[0]?.lng;
    let latlng = L.latLng(53.4862, -1.8904);
    if (latCoo && latCoo !== 'not collected' && latCoo !== 'not provided') {
      latlng = L.latLng(latCoo, lngCoo);
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: latlng,
      zoom: 5,
      layers: [this.tiles],
    });

    this.markers = (window as any).L.markerClusterGroup({
      spiderfyOnMaxZoom: false,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: false,
      removeOutsideVisibleBounds: false
    });

    this.markers.on('clusterclick', function (a) {
      a.layer.spiderfy();
    });

    this.getLatLong();
    this.showCursorCoordinates();
    this.map.addLayer(this.markers);
  }

  getLatLong(): any {
    if (!this.orgGeoList || this.orgGeoList.length === 0) {
      console.warn('orgGeoList is undefined or empty');
      return;
    }

    let orgGeoSize = this.orgGeoList.length
    for (var i = 0; i < orgGeoSize; i++) {
      if (this.orgGeoList[i].lat != 'not collected' && this.orgGeoList[i].lat != 'not provided') {
        const latlng = L.latLng(this.orgGeoList[i].lat, this.orgGeoList[i].lng);
        const m = L.marker(latlng);
        const accession = `<div><a target="_blank" href=/organism/${this.orgGeoList[i].accession}>${this.orgGeoList[i].accession}</a></div>`;
        // const organism = this.orgGeoList[i].organism != null ? `<div>${this.orgGeoList[i].organism}</div>` : '';
        const commonName = this.orgGeoList[i].commonName != null ? `<div>${this.orgGeoList[i].commonName}</div>` : '';
        const organismPart = `<div>${this.orgGeoList[i].organismPart}</div>`;
        const popupcontent = accession + commonName + organismPart;
        const popup = L.popup({
          closeOnClick: false,
          autoClose: true,
          closeButton: false
        }).setContent(popupcontent);

        m.bindPopup(popup)
        this.markers.addLayer(m);
      }
    }

    if (!this.specGeoList || this.specGeoList.length === 0) {
      console.warn('specGeoList is undefined or empty');
    }

    let specGeoSize = this.specGeoList.length
    for (var i = 0; i < specGeoSize; i++) {
      if (this.specGeoList[i].lat != 'not collected' && this.specGeoList[i].lat != 'not provided') {
        const latlng = L.latLng(this.specGeoList[i].lat, this.specGeoList[i].lng);
        const m = L.marker(latlng);
        const accession = `<div><a target="_blank" href=/specimens/details/${this.specGeoList[i].accession}>${this.specGeoList[i].accession}</a></div>`;
        // const organism = this.specGeoList[i].organism != null ? `<div>${this.specGeoList[i].organism}</div>` : '';
        const commonName = this.specGeoList[i].commonName != null ? `<div>${this.specGeoList[i].commonName}</div>` : '';
        const organismPart = `<div>${this.specGeoList[i].organismPart}</div>`;
        const popupcontent = accession + commonName + organismPart;
        const popup = L.popup({
          closeOnClick: false,
          autoClose: true,
          closeButton: false
        }).setContent(popupcontent);
        m.bindPopup(popup)
        this.markers.addLayer(m);
      }
    }
  }

  showCursorCoordinates() {
    const Coordinates = L.Control.extend({
      onAdd: (map: { addEventListener: (arg0: string, arg1: (e: any) => void) => void; }) => {
        const container = L.DomUtil.create("div");
        container.style.backgroundColor = "rgba(255,255,255,.8)";
        map.addEventListener("mousemove", e => {
          container.innerHTML = `Lat: ${e.latlng.lat.toFixed(4)} Lng: ${e.latlng.lng.toFixed(4)}`;
        });
        return container;
      }
    });
    this.map.addControl(new Coordinates({ position: "bottomright" }));
  }

}
