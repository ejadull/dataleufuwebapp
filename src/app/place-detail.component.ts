import { Component, OnInit }         from '@angular/core';
import {Input, Output, EventEmitter} from '@angular/core'
import { PlaceService }            from './place.service';
import { CategoryService }          from './category.service';
import { Category } from './place';

declare var Cesium : any;

@Component({
    selector: 'place-detail',
    templateUrl: './place-detail.component.html',

})
export class PlaceDetailComponent implements OnInit{

    @Input() viewer: any;
    handler: any;
    currentEntity: any;
    currentPlace: any;
    categories: Category[];
    visible: boolean;

    constructor(private placeService: PlaceService, private categoryService: CategoryService) {}

    flyToEntity(event: any){
        event.preventDefault();
        console.log("flyToEntity " + this.currentEntity);
        if(this.currentEntity !== undefined){
            this.viewer.flyTo(this.currentEntity, 200);
        }
    }
    close(){
        this.visible = false;
    }
    setCurrentItem(item: any){
        console.log("setCurrentItem item" + item);
        var that = this;
        this.currentEntity = item;
        if(item !== undefined){
            var id = item.id;
            this.visible = true;
            this.placeService
                .getPlace(+id)
                    .then(function (place){
                        that.currentPlace = place;
                        var minimum = 1;
                        var maximum = 10;
                        var randomnumber = Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
                        if (that.currentPlace.image == undefined){
                            that.currentPlace.image = 'http://lorempixel.com/600/400/nature/' + randomnumber;
                        }
                    });
        }else{
            this.currentPlace = undefined;
            this.visible = false;
        }
        console.log("setCurrentItem currentPlace " + this.currentPlace);

    }
    ngOnInit() {
        console.log("PlaceDetailComponent oninit");
        this.categoryService
            .getCategories()
            .then(categories => this.categories = categories);

        var that = this;
        this.handler = new Cesium.ScreenSpaceEventHandler(this.viewer.scene.canvas);
        this.handler.setInputAction(function(movement:any){
            var item = false;
            console.log("that.viewer.scene.mode", that.viewer.scene.mode);
            console.log("that.viewer.scene.mode !== Cesium.SceneMode.MORPHING" + that.viewer.scene.mode !== Cesium.SceneMode.MORPHING);
            if (that.viewer.scene.mode !== Cesium.SceneMode.MORPHING) {
                //var pickedObject = that.viewer.scene.pick(movement.endPosition);
                var pickedObject = that.viewer.scene.pick(movement.position);
                console.log("pick pickedObject: ");
                console.dir(pickedObject);
                console.log("that.viewer.scene.pickPositionSupported " + that.viewer.scene.pickPositionSupported);
                if (that.viewer.scene.pickPositionSupported && Cesium.defined(pickedObject) ) {
                    var cartesian = that.viewer.scene.pickPosition(movement.position);
                    console.log("cartesian " + cartesian);
                    that.setCurrentItem(pickedObject.id);
                        item = true;
                    /*if (Cesium.defined(cartesian)) {
                        //that.setCurrentItem(pickedObject.id.properties.pk);
                        console.log("final pick pickedObject: ");
                        console.dir(pickedObject.id);
                        that.setCurrentItem(pickedObject.id);
                        item = true;
                    }*/
                }
            }
            if (!item){
                that.setCurrentItem(undefined);
            }

        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    }

    getCategory(id: number): Category {
        return this.categories.find(x => x.pk == id );
    }


}
