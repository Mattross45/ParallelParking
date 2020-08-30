var app = angular.module("VehiculeSimulationApp", []);

app.controller('VehiculeSimulationCtrl', ['$scope','$timeout', function($scope,$timeout) {

  $scope.rad2deg =  180 / Math.PI ;
  $scope.deg2rad =  1.0 / $scope.rad2deg ;
  $scope.angle_vehicule = 0;
  $scope.angle_roue = 30; //Phi

  // dimension des vehicules en centimetres
  // voir https://www.renault.fr/vehicules/vehicules-particuliers/captur/dimensions.html

  $scope.Lveh = 260         // distance entre l'axe des roues avt et arrieres
  $scope.Dpv  = 100          // distance entre l'axe roue arriere et le pivot
  $scope.Drp  = 400          // distance entre l'axe de la remorque et le pivot
  $scope.s    = -200             // vitesse en km/h du vehicule
  $scope.dt   = 0.01           // incrément de temps dans les calculs pas à pas

  $scope.e  = 300.0          // espacement horizontal entre le vehicule(un fois garé ) avec l'arrière du véhicule déjà stationné
  $scope.d  = 25.0          // espacement verrtical entre le  coté vehicule (avant manoeuvre) avec le coté gauche du du véhicule déjà stationné
  $scope.largeurVehicule = 177;  // largeur véhicule
  $scope.longueurVehicule = 412;  // longueur totale du vehicule 
  $scope.ESroues = 153             // espace entre les roues 
  $scope.porteAFauxArriere = 65   // porte-à-faux arrière
  // Position Initiale du véhicule fixe
  $scope.xg1=2000
  $scope.yg1=350
  $scope.Tg1=0

  $scope.xg2=1000
  $scope.yg2=350
  $scope.Tg2=0

  $scope.xv = $scope.xg1
  $scope.yv = $scope.yg1 - $scope.largeurVehicule - $scope.d ;
  $scope.Tv=0

  $scope.XvInit = $scope.xv
  $scope.YvInit = $scope.yv

  $scope.inflexionPointX = 0;
  $scope.inflexionPointY = 0;

  $scope.Tr= -1 * Math.PI/180;
  $scope.xr=1500
  $scope.yr=100

  $scope.R = 0 // rayon de bracage

  calculerRayonDeBracage();
  calculDuPointInflexion();


  function step(current) {

     // les constantes
    var dt = $scope.dt; // pas de temps
    var Lveh = $scope.Lveh;
    var Dpv  = $scope.Dpv;
    var Drp  = $scope.Drp;
    var phi=$scope.angle_roue * Math.PI/180;
    var s= $scope.s;


   // mise à jour du rayon de bracage en fonction de l'angle
   $scope.R = $scope.Lveh / Math.tan(phi);

    // les variables courantes
    var xv, yv, Tv, xr, yr, Tr;
    xv = $scope.xv;
    yv = $scope.yv;
    Tv = $scope.Tv; // en radian
    xr = $scope.xr;
    yr = $scope.yr;
    Tr = $scope.Tr; // en radian

    // xv,yv position du véhicule
    // Tv : angle du véhicule
    // xr,yr position du remorque
    //  Tr : angle du remorque

    // deplacement en x et y  du vehicule
    var xv1 = xv + dt * s * Math.cos(Tv)
    var yv1 = yv + dt * s * Math.sin(Tv)
    // Deplacement angulaire du vehicule
    var Tv1 = Tv + dt * s * (1 / Lveh) * Math.tan(phi)


    // "force que subit la remorque"



    $scope.xv = xv1;
    $scope.yv = yv1;
    $scope.Tv = Tv1; // en radian


    $scope.xr1 = xr
    $scope.yr1 = yr
    $scope.Tr1 = Tr

    return [xv1, yv1, Tv1, xr, yr, Tr]

}

function calculerRayonDeBracage() {
    const a = $scope.longueurVehicule + $scope.e ;
    const b = $scope.largeurVehicule   + $scope.d;

    // trouver l'angle de bracage
    const RayonBracage = Math.sqrt(a*a +b*b)/(4.0*Math.cos(Math.atan(a/b)));
    
    const RayonBracage2 = Math.sqrt(2*a*a +b*b + a*a*a*a/(b*b))/4;
  
     // on en déduit Phi
   $scope.R = RayonBracage;
   $scope.angle_roue = Math.atan($scope.Lveh/RayonBracage)  * 180/Math.PI;
    return RayonBracage;
}

function calculDuPointInflexion() {
    const a = $scope.longueurVehicule  + $scope.e;
    const b = $scope.largeurVehicule + $scope.d;
    $scope.inflexionPointX = $scope.XvInit - a/2;
    $scope.inflexionPointY = $scope.YvInit + b/2;

}
$scope.seGarerAutomatiquement = function seGarerAutomatiquement() {

    calculerRayonDeBracage();
    calculDuPointInflexion();

    let counter = 0;
    let phase = 0; // 0 => bracage =< 1 contre bracage
    function autoStep(){
      
        if ($scope.yv < $scope.inflexionPointY) {
            counter++;
            step();
            $timeout(autoStep,20);

        } else {
            if (phase ===0 ) {
                // il faut contre-braquer
                $scope.angle_roue = -$scope.angle_roue;
                phase = 1;
            }
            counter--;
            step();
            if (counter>0) {
                $timeout(autoStep,20);
            }
        }
    }
    autoStep();

}
$scope.refresh =function() {

    calculerRayonDeBracage();
    calculDuPointInflexion();
}
function test() {

    var increment = 1E-2;

    // position courante contient  xv, yv, Tv, xr, yr, Tr
    current = [0, 0, 0, $scope.Dpv + $scope.Drp, 0, 0]
    for(var i = 0;i<200;i++) {
        console.log(current)
        current = step(current, increment)
    }
}
//test();
  $scope.step = step;
}]);