﻿import {Component } from '@angular/core';
import {Input, Output, EventEmitter} from '@angular/core';
import {AuthenticationService } from './authentication.service';
import {UserProfile} from './../place';
import {BusyModule} from 'angular2-busy';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
    templateUrl: './register.component.html',
})

export class RegisterComponent {
    model: any = {};
    error: any = {};
    busy: any;

    @Output() user = new EventEmitter<UserProfile>();
    public submitted = false;
    public currentUser: UserProfile;

    constructor(
         private authenticationService: AuthenticationService,
         public activeModal: NgbActiveModal) //Modal del login
         { }

    register(): any {
       this.busy = this.authenticationService.create(this.model)
            .subscribe(
                data => {
                     this.user.emit(this.authenticationService.user_profile);
                     this.currentUser = this.authenticationService.user_profile;
                     this.submitted = true;
                },
                error => {
                    this.error = error;
                });
    }

    cancel(){
        this.user.emit(null);
        this.activeModal.close();
    }

    close(){
        this.activeModal.close();
    }

}
