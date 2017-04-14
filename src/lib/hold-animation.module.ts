import { NgModule, ModuleWithProviders} from "@angular/core";

import { CommonModule } from '@angular/common';

import { HoldAnimationComponent } from './hold-animation.component';

@NgModule({
    imports: [CommonModule],
    declarations: [HoldAnimationComponent],
    exports: [HoldAnimationComponent]
})
export class HoldAnimationModule {
    static forRoot(): ModuleWithProviders {
    return {
      ngModule: HoldAnimationModule
    }
  }
  
  static forChild(): ModuleWithProviders {
    return {
      ngModule: HoldAnimationModule
    };
  }
}
