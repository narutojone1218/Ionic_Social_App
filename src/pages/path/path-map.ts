import { AfterViewInit, Component, ElementRef, ViewChild, NgZone } from '@angular/core';
import { NavController, Navbar, NavParams, Platform, LoadingController, ModalController, AlertController, App } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { googlemaps } from 'googlemaps';
import * as MarkerWithLabel from 'markerwithlabel';


import { Category } from '../../models/category';
import { Comment } from '../../models/comment';
import { MapService } from '../../shared/map.service';
import { Path } from '../../models/path';
import { Inspiration } from '../../models/inspiration';
import { ServerService, ServerGetResponse } from '../../shared/server.service';
import { PathDetailPage } from "../path/path-detail";
import { PlaceDetailPage } from "../place/place-detail";
import { Place } from "../../models/place";
import { CommentPlacePage } from "../comment/comment-place";
import { CommentPathPage } from "../comment/comment-path";
import { FeedPage } from "../feed/feed";
import { GeolocationService } from "../../shared/geolocation.service";
import { TabsPage } from "../tabs/tabs";
import { PathValidationPage } from "../path/path-validation";
import { SegmentEvents } from "../../shared/analytics.model";
import { AnalyticsService } from "../../shared/analytics.service";

@Component({
  selector: 'page-path-map',
  templateUrl: 'path-map.html'
})
export class PathMapPage implements AfterViewInit {
  @ViewChild('pathMap')
  private mapElement: ElementRef;

  @ViewChild('pathMapNavBar')
  private navBar: Navbar;

  private path: Path;
  private pathMap: google.maps.Map;
  private pathMarkers: Array<google.maps.Marker>;
  private userImg = 'https://firebasestorage.googleapis.com/v0/b/pathtime-1360.appspot.com/o/utils%2Fbluecircle.png?alt=media&token=aebbe58b-c93f-4637-9b4d-ba8028a469f5';
  private userMarker: google.maps.Marker;

  constructor(private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private params: NavParams,
    private platform: Platform,
    private mapService: MapService,
    private server: ServerService,
    private ngZone: NgZone,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private userLocation: GeolocationService,
    private analyticsService: AnalyticsService) {
    this.path = params.get("path");
  }

  ionViewWillEnter() {
    this.analyticsService.trackScreenPath(SegmentEvents.PathMap, this.path);
  }

  ngAfterViewInit() {
    this.pathMap = new google.maps.Map(this.mapElement.nativeElement, this.mapService.getOptions());
    this.pathMarkers = new Array<google.maps.Marker>();
    this.path.getPolyline();
    this.displayMarkers(this.path);
    this.path.polyline.setOptions({ strokeOpacity: 1 });
    this.path.polyline.setMap(this.pathMap);
    this.displayUserPosition();
    // this.mapService.ZoomToPathAndUser(this.performMap, this.path.polyline, this.userMarker.getPosition()); Maybe Later
    this.mapService.ZoomToPath(this.pathMap, this.path.polyline);
  }

  private mapReady(): void {
    //this.placeDetails = new google.maps.places.PlacesService(this.inspirationMap);
  }

  private displayUserPosition(): void {
    var position = this.userLocation.getLastLocation();
    if (position) {
      var myLatLng = new google.maps.LatLng(position.latitude, position.longitude);
      if (this.userMarker) {
        this.userMarker.setPosition(myLatLng);
      } else {
        this.userMarker = new google.maps.Marker({
          position: myLatLng,
          map: this.pathMap,
          icon: this.userImg
        });
      }
    }
  }

  private displayMarkers(path: Path): void {
    this.pathMarkers = new Array<google.maps.Marker>();
    path.places.forEach(p => {
      let markerLabel = MarkerWithLabel(google.maps);
      var marker = new markerLabel({
        position: p.getLatLng(),
        animation: google.maps.Animation.DROP,
        map: this.pathMap,
        icon: ' ',
        labelContent: '<i class="ion-' + p.getCategory(0).getIcon() + '"></i>',
        labelClass: "creation-marker-label",
        labelAnchor: new google.maps.Point(25, 25)
      });
      this.pathMarkers.push(marker);
      let listener = google.maps.event.addListener(marker, 'click', () => {
        this.ngZone.run(() => {
          this.goPlaceDetail(p);
        });
      });
    });
  }

  goPlaceDetail(p: Place): void {
    let loading = this.loadingCtrl.create({
      spinner: 'hide',
      content: this.server.getLoadingContent('Download Place Infos'),
      dismissOnPageChange: true
    });

    loading.present();
    this.server.getPlace(p.google_id)
      .subscribe(place => {
        this.navCtrl.push(PlaceDetailPage, { place: place });
        loading.dismiss();
      }, error => {
        //FIXME: Dislplay Toast
        loading.dismiss();
      });
  }



}
