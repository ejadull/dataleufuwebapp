import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import {AboutComponent} from './about/about.component';
import {HelpComponent} from './help/help.component';
import { PlaceFormComponent }   from './place-form.component';
import { PlaceService }            from './place.service';
import { TestComponent }            from './test.component';
import { CreatePointComponent }            from './create-point.component';
import { PlaceDetailComponent }         from './place-detail.component';
import { LayerComponent }         from './layer.component';
import { LayerService }         from './layer.service';
import { PathComponent }         from './path.component';
import {Input,ElementRef, ComponentFactory,ComponentRef, ComponentFactoryResolver, ViewContainerRef,
    ChangeDetectorRef,  ViewChild, TemplateRef, Output, EventEmitter} from '@angular/core'
import {UserProfile, Place, Point, GeoPlace} from './place';
import { UserComponent }         from './user.component';
import { MessageComponent }         from './message.component';
import { LoginRequiredComponent }         from './loginRequired.component';
import 'rxjs/add/operator/switchMap';
import { APP_BASE_URL } from './config';
import { FacebookService, InitParams, LoginResponse } from 'ngx-facebook';
import { MapService }         from './map.service';
import {TrackerService} from "./tracker.service";

declare var Cesium : any;
declare var FB: any;

@Component({
  selector: 'map',
  templateUrl: './map.component.html',
  providers: [MapService]
})
export class MapComponent implements OnInit {
    viewer: any;
    currentItem: any;
    selectingPoint: any;
    docElement: any;
    user: UserProfile;
    aboutCollapsed = false;

    @ViewChild("messageContainer", { read: ViewContainerRef }) messageContainer: any;
    messageComponentRef: any;

    @ViewChild("detailContainer", { read: ViewContainerRef }) detailContainer: any;
    detailComponentRef: any;

    @ViewChild("layerContainer", { read: ViewContainerRef }) layerContainer: any;
    layerComponentRef: any;

    @ViewChild("pathContainer", { read: ViewContainerRef }) pathContainer: any;
    pathComponentRef: any;

    @ViewChild("userContainer", { read: ViewContainerRef }) userContainer: any;
    userComponentRef: any;

    constructor(public element: ElementRef, private modalService: NgbModal,
            private placeService: PlaceService, private layerService: LayerService,
            private resolver: ComponentFactoryResolver,
            private route: ActivatedRoute, private mapService: MapService,
            private fb: FacebookService,
            private tracker: TrackerService
            ){}

    ngOnInit() {
        this.mapService.init(this.element.nativeElement);
        this.viewer = this.mapService.getMap();
        this.initUser();
        this.initPaths();
        this.initDetails();

        var that = this;
        var promise = this.pathComponentRef.instance.rotate().then(
            function () {
                that.initLayers();

                that.route.paramMap
                    .switchMap((params: ParamMap) => {
                        if (+params.get('id') != 0)
                            return that.placeService.getPlace(+params.get('id'));
                        else{
                            that.pathComponentRef.instance.rio(null);
                            return [];
                        }

                    })
                    .subscribe(place => that.gotoPlace(place));

                }
            );

    }

    gotoPlace(place: GeoPlace){
        console.log("gotoPlace place", place);
        if (place){
            this.tracker.emitEvent("map", "goto", "goto", place.pk);
            this.detailComponentRef.instance.testPlace(place);
            var options = {

                destination : Cesium.Cartesian3.fromDegrees(place.point.coordinates[0], place.point.coordinates[1], 1000),
                duration: 6,
                /*  orientation: {
                    heading : 6.1329933722128125,//Cesium.Math.toRadians(15.0),
                    pitch : -0.25777284671769296, //-Cesium.Math.PI_OVER_FOUR,
                    roll : 6.271157632771452//0.0
                },*/
                pitchAdjustHeight: 800,
                complete: function() {
                    setTimeout(function() {
                       // TODO
                    }, 1000);
                }
            };
            this.viewer.scene.camera.flyTo(options);

        }else{
            this.pathComponentRef.instance.rio(null);
        }
    }

    logCamera(event: any): void{
        event.preventDefault();
        console.log("Inicia log camera");
        console.log("*****************");
        var camera = this.viewer.scene.camera;
        //console.log("position: " + camera.position);
        console.log("positionCartographic: " + camera.positionCartographic);
        //console.log("positionWC: " + camera.positionWC);
        console.log("pitch: " + camera.pitch);
        //console.log("right: " + camera.right);
        //console.log("rightWC: " + camera.rightWC);
        console.log("roll: " + camera.roll);
        //console.log("up: " + camera.up);
        //console.log("upWC: " + camera.upWC);
        console.log("heading: " + camera.heading);
        //console.log("direction: " + camera.direction);
        //console.log("directionWC: " + camera.directionWC);
        console.log("Fin log camera");
        console.log("*****************");



    }

    about(event: any): void {
        event.preventDefault();
        this.tracker.emitEvent("sobre_el_proyecto", "ver_sobre_el_proyecto");
        const modalRef = this.modalService.open(AboutComponent, { windowClass: 'modal-fullscreen' });
    }

    help(event: any): void {
        event.preventDefault();
        this.tracker.emitEvent("ayuda", "ver_ayuda");
        const modalRef = this.modalService.open(HelpComponent);
    }


    initDetails(){
        //Creo el componente de visualización de detalles
        this.detailContainer.clear();
        const factory: any = this.resolver.resolveComponentFactory(PlaceDetailComponent);
        this.detailComponentRef = this.detailContainer.createComponent(factory);
        this.detailComponentRef.instance.viewer = this.viewer;
    }
    initLayers():void{
        //Creo el componente de visualización de capas
        this.layerContainer.clear();
        const factory: any = this.resolver.resolveComponentFactory(LayerComponent);
        this.layerComponentRef = this.layerContainer.createComponent(factory);
        //this.layerComponentRef.instance.viewer = this.viewer;
    }

    initPaths(){
        //Creo el componente de visualización de recorridos
        console.log("initPaths");
        this.pathContainer.clear();
        const factory: any = this.resolver.resolveComponentFactory(PathComponent);
        this.pathComponentRef = this.pathContainer.createComponent(factory);
    }

    initUser(){
        //Creo el componente de gestión del menú de usuarios
        console.log("initUser");
        this.userContainer.clear();
        const factory: any = this.resolver.resolveComponentFactory(UserComponent);
        this.userComponentRef = this.userContainer.createComponent(factory);
        this.userComponentRef.instance.viewer = this.viewer;
        this.userComponentRef.instance.user.subscribe((user:any) => {
            this.user = user;
        })
    }

    ngOnDestroy() {
        console.log("MapComponent ngOnDestroy");
        this.messageComponentRef.destroy();
        this.detailComponentRef.destroy();
    }

    addPoint(event:any):void{
        event.preventDefault();

        if (!this.user){
            this.tracker.emitEvent("punto", "publicar_no_registrado");
            this.loginRequired("Para ingresar un punto debes registrarte.");
            return;
        }
        var that = this;

        const factory: any = this.resolver.resolveComponentFactory(PlaceFormComponent);
        this.messageComponentRef = this.messageContainer.createComponent(factory);
        const component: any  = this.messageComponentRef.instance;

        component.viewer = this.viewer;
        component.mapComponent = this;
        component.pointCreated.subscribe((newPlace: any) => {
            this.messageComponentRef.destroy();
            that.tracker.emitEvent("punto", "publicar");
            var layer = that.layerComponentRef.instance.getCategoryLayer(newPlace.category);
            that.layerComponentRef.instance.relaodLayer(layer);
            that.gotoPlace(newPlace);
        });
        component.cancelled.subscribe((event:any) => {
            console.log("PlaceFormComponent cancelled messageComponentRef.destroy()");
            this.messageComponentRef.destroy();
        });

    }


    collapseLayers(event: any){
        event.preventDefault();
        this.layerComponentRef.instance.collapsed = !this.layerComponentRef.instance.collapsed;
        if (this.layerComponentRef.instance.collapsed)
            this.tracker.emitEvent("capas", "desplegar_capas");
        else
            this.tracker.emitEvent("capas", "ocultar_capas");
    }


    collapsePaths(event: any){
        event.preventDefault();
        this.pathComponentRef.instance.collapsed = !this.pathComponentRef.instance.collapsed;
        if (this.pathComponentRef.instance.collapsed)
            this.tracker.emitEvent("recorridos", "desplegar_recorridos");
        else
            this.tracker.emitEvent("recorridos", "ocultar_recorridos");
    }

    collapseAbout(event: any){
        event.preventDefault();
        this.aboutCollapsed = !this.aboutCollapsed;
    }

    message(text:string){
        const modalRef = this.modalService.open(MessageComponent);
        modalRef.componentInstance.message = text;
    }

    loginRequired(text:string){
        const modalRef = this.modalService.open(LoginRequiredComponent);
        modalRef.componentInstance.message = text;
        modalRef.componentInstance.doLogin.subscribe((event:any) => {
            this.userComponentRef.instance.login();
        });

    }
    getUrl(): string{
        return APP_BASE_URL;
    }
    facebookOpened():void{
        this.tracker.emitEvent("menu", "compartir_facebook");
    }
    twitterOpened():void{
        this.tracker.emitEvent("menu", "compartir_twitter");
    }
    contactanosOpened():void{
        this.tracker.emitEvent("menu", "contactanos");
    }


    gotoMyLocation(event: any): void{
        if(event)
            event.preventDefault();
        this.tracker.emitEvent("menu", "volar_a_mi_ubicacion");
        var that = this;
        // Create callback for browser's geolocation
        function fly(position: any) {
            that.viewer.camera.flyTo({
                destination : Cesium.Cartesian3.fromDegrees(position.coords.longitude, position.coords.latitude, 1000.0)
            });
        }
        console.log("navigator.geolocation", navigator.geolocation);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(fly, function (error: any){
                 var text = "No es posible acceder a tu ubicación. El navegador no soporta geolocalización.";
                 const modalRef = that.modalService.open(MessageComponent);
                 modalRef.componentInstance.message = text;
                 console.log("error", error);
            });
        } else {
            this.showMyLocationError(null);
            that.tracker.emitEvent("menu", "volar_a_mi_ubicacion_no_permitido");
        }

    }
    showMyLocationError(error: any){
        var text = "No es posible acceder a tu ubicación. El navegador no soporta geolocalización.-";
        const modalRef = this.modalService.open(MessageComponent);
        modalRef.componentInstance.message = text;
        console.log("error", error);
    }
}
