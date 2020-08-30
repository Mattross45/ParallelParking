var app = angular.module("VehiculeSimulationApp", []);

app.controller('VehiculeSimulationCtrl', ['$scope', '$timeout', function ($scope, $timeout) {

    // initialisation des constantes et des valeurs initiales
    {
        $scope.rad2deg = 180 / Math.PI;
        $scope.deg2rad = 1.0 / $scope.rad2deg;
        $scope.angle_vehicule = 0;
        $scope.angle_roue = 30; //Phi

        // dimension des vehicules en centimetres
        // voir https://www.renault.fr/vehicules/vehicules-particuliers/captur/dimensions.html

        $scope.Lveh = 260; // distance entre l'axe des roues avt et arrieres
        $scope.Dpv = 100; // distance entre l'axe roue arriere et le pivot
        $scope.Drp = 400; // distance entre l'axe de la remorque et le pivot
        $scope.s = -200; // vitesse en km/h du vehicule
        $scope.dt = 0.01; // incrément de temps dans les calculs pas à pas

        $scope.e = 300.0; // espacement horizontal entre le vehicule(un fois garé ) avec l'arrière du véhicule déjà stationné
        $scope.d = 25.0; // espacement verrtical entre le  coté vehicule (avant manoeuvre) avec le coté gauche du du véhicule déjà stationné
        $scope.largeurVehicule = 177; // largeur véhicule
        $scope.longueurVehicule = 412; // longueur totale du vehicule
        $scope.ESroues = 153; // espace entre les roues
        $scope.porteAFauxArriere = 65; // porte-à-faux arrière
        $scope.porteAFauxAvant = 87;
        $scope.porteAFauxAvant = $scope.longueurVehicule - $scope.porteAFauxArriere - $scope.Lveh;

        // Position Initiale du véhicule fixe
        $scope.xg1 = 2000;   // de devant
        $scope.yg1 = 350;
        $scope.Tg1 = 0;

        $scope.xg2 = 1100;   // de derrière
        $scope.yg2 = 350;
        $scope.Tg2 = 0;

        $scope.xv = $scope.xg1;
        $scope.yv = $scope.yg1 - $scope.largeurVehicule - $scope.d;
        $scope.Tv = 0;

        $scope.XvInit = $scope.xv;
        $scope.YvInit = $scope.yv;


        $scope.inflexionPointX = 0;
        $scope.inflexionPointY = 0;

        $scope.R = 0; // rayon de bracage
    }

    calculerRayonDeBracage($scope.e,$scope.d);
    calculDuPointInflexion();

    function rotate(angle, centre, point) {

        let x = point[0];
        let y = point[1];
        let ca = Math.cos(angle);
        let sa = Math.sin(angle);

        let xx = (x - centre[0]) * ca - (y - centre[0]) * sa + centre[0];
        let yy = (x - centre[1]) * sa + (y - centre[1]) * ca + centre[1];

        return [xx, yy];
    }

    function translate(point, trans)
    {
        return [point[0] + trans[0], point[1] + trans[1]];
    }

    function distance(point1, point2)
    {
        const dx = point1[0] - point2[0];
        const dy = point1[1] - point2[1];
        return Math.sqrt(dx*dx + dy*dy);
    }

    function step(current) {

        const {
            Lveh,
            Dpv,
            Drp,
            angle_roue,
            dt,
            deg2rad,
            s,
            xg1,xg2,
            yg1,yg2,
            porteAFauxAvant,
            porteAFauxArriere,
            largeurVehicule
        } = $scope;

        // les constantes
        var phi = angle_roue * deg2rad;

        // mise à jour du rayon de bracage en fonction de l'angle
        const R = Lveh / Math.tan(phi);


        // les variables courantes
        const {
            xv,
            yv,
            Tv,
            xr,
            yr,
            Tr
        } = $scope;

        // deplacement en x et y  du vehicule
        var xv1 = xv + dt * s * Math.cos(Tv)
        var yv1 = yv + dt * s * Math.sin(Tv)
        // Deplacement angulaire du vehicule
        var Tv1 = Tv + dt * s * (1 / Lveh) * Math.tan(phi);

        // ----------------------------------------------------
        // calcul de la distance entre:
        //   - le point avant droit du véhicule qui se gare
        //   - le point arrière gauche du véhicule lateral avant
        // -----------------------------------------------------
        let corner1 = [ Lveh + porteAFauxAvant, largeurVehicule / 2.0 ];
        let corner2 = [-porteAFauxArriere, -largeurVehicule / 2.0];
        let corner3 = [ Lveh + porteAFauxAvant, -largeurVehicule / 2.0 ];
       
        // (corner2)
        // +---------------------+ (corner3)
        // |                     |
        // |                     |
        // +---------------------+ (corner1)

        const pointCollision1 = translate(rotate(Tv1, [0, 0], corner1), [xv1, yv1]);
        const pointCollision2 = translate(corner2, [xg1, yg1]);

        // const mes2 = distance(pointCollision1,pointCollision2);
        const mes2 = pointCollision2[0]-pointCollision1[0];
        // ----------------------------------------------------
        // calcul de la distance entre:
        //   - le point arrière gauche du véhicule qui se gare
        //   - le point avant gauche du véhicule lateral arrière
        // -----------------------------------------------------

        const pointCollision3 = translate(rotate(Tv1, [0,0], corner2), [xv1,yv1])
        const pointCollision4 = translate(corner3, [xg2, yg2]);
        
       // const mes1=distance(pointCollision3,pointCollision4);;
       const mes1=pointCollision3[0]-pointCollision4[0];

       Object.assign($scope, {
            xv:xv1,yv:yv1,Tv:Tv1,
            R,
            pointCollision1,
            pointCollision2,
            pointCollision3,
            pointCollision4,
            mes2,mes1
        });


        return [xv1, yv1, Tv1, xr, yr, Tr]

    }

    function calculerRayonDeBracageIdeal(e,d) {
        let {
            longueurVehicule,
            largeurVehicule,
            Lveh,
            deg2rad,
        } = $scope;

        const a = longueurVehicule + e;
        const b = largeurVehicule  + d;

        // trouver l'angle de bracage
        const RayonBracage = Math.sqrt(a * a + b * b) / (4.0 * Math.cos(Math.atan(a / b)));
        const RayonBracage2 = Math.sqrt(2 * a * a + b * b + a * a * a * a / (b * b)) / 4;
        return RayonBracage;
    }
    function calculerRayonDeBracagePourAngleRoue(angle_roue) {
        const {
            Lveh,
            deg2rad,
        } = $scope;
        return  Lveh / Math.tan(angle_roue *deg2rad);
 
    }
    function calculerAngleDesRouesPourRayonBracage(RayonBracage) { // en degre
        const {
            Lveh,
            deg2rad,
        } = $scope;
        return Math.atan(Lveh / RayonBracage) / deg2rad;
    }
    function calculerRayonDeBracageMini() {
        return calculerRayonDeBracagePourAngleRoue(35);
     }
    function calculerRayonDeBracage(e,d) {

        const {largeurVehicule, longueurVehicule} = $scope;

        let RayonBracage = calculerRayonDeBracageIdeal(e,d,$scope.angle_roue);

        let  angle_roue= calculerAngleDesRouesPourRayonBracage(RayonBracage);
        const Rmin = calculerRayonDeBracageMini();

        // on en déduit Phi
        let R = RayonBracage;
        let eajuste = e;

        // On contraint le rayon de bracage à 35 degree

        if (angle_roue > 35) {
            angle_roue = 35;
            R = Rmin;
            const b = largeurVehicule  + d;

            eajuste = Math.sqrt(b * (4 * Rmin - b)) - longueurVehicule;
        }

        Object.assign($scope, {
            R,
            angle_roue,
            eajuste,
            Rmin
        });

        return R;
    }
    function calculerRayonDeBracageOptimum(e,d) {
        return calculerRayonDeBracage(e,d);
    }


    function calculDuPointInflexion() {
        const a = $scope.longueurVehicule + $scope.bestE;
        const b = $scope.largeurVehicule + $scope.d;
        $scope.inflexionPointX = $scope.XvInit - a / 2;
        $scope.inflexionPointY = $scope.YvInit + b / 2;

        $scope.centreRotation1 = [
             $scope.XvInit, 
             $scope.YvInit+$scope.R
            ];

        $scope.centreRotation2 = [ 
            $scope.XvInit-$scope.longueurVehicule-$scope.bestE, 
            $scope.YvInit+$scope.largeurVehicule+$scope.d-$scope.R
        ];
       
    }

    function calculR1(e) {

        const {
            largeurVehicule,
            Lveh,
            porteAFauxAvant,
            d
        } = $scope;

        const R = calculerRayonDeBracageIdeal(e,d);
        return Math.sqrt(
            Math.pow(Math.abs(R) + largeurVehicule / 2, 2) 
            + Math.pow(Lveh + porteAFauxAvant, 2)
        );
    }

    function calculR2(e) {
        const {
            largeurVehicule,
            Lveh,
            porteAFauxAvant,
            ESroues,
            d
        } = $scope;
        const R = calculerRayonDeBracageIdeal(e,d);
        return Math.sqrt(
            Math.pow(Lveh + porteAFauxAvant + e, 2) +
            Math.pow(Math.abs(R) - ESroues / 2.0, 2)
        );

    }

    function caculEPourNonCollisionParDichotomie(){
        // soit une fonction croissante
        function f(x) {
            const r2 =calculR2(x);
            const r1 =calculR1(x);
            return  r2 - r1;
        }

        let xmin = 0;
        let xmax = 3000;

        let fmin = f(xmin);
        let fmax = f(xmax);
        if (fmin>=0) {
            return xmin; // 
        }
        if (fmin>fmax) {
            throw new Error("Fonction n'est pas croissante");   
        } 
        if (fmin>=0) {
            throw new Error("Pas de solution car f(xmin)>0");
        }
        if (fmax<=0) {
            return xmax;
            throw new Error("Pas de solution car f(xmax)<0");
        }
        while(true) {
            let x = (xmax+xmin)/2.0;
            let fx = f(x);
            if (Math.abs(fx)<1E-3){
                return x;
            }
            if (fx > 0 ) {
                xmax = x; 
            } else if(fx < 0 ) {
                xmin = x; 
            }
        }
    }

    function calculDesRayonsCollision() {

        const {eajuste,e }= $scope;

        // calcul d'un R sans collision, 
        // trouvons e pour que R2(e)^2 = R1(e)^2
        // (|R| + largeurVehicule/2)^2 + (Lveh+porteAFauxAvant)^2 - (Lveh+porteAFauxAvant+e)^2 + (|R| - largeurVehicule/2)^2 = 0
        // const eNonCollision =eajuste;
        const eNonCollision = caculEPourNonCollisionParDichotomie();

        const bestE = Math.max(eNonCollision,eajuste,e);
        // rayon du cercle parcouru par le coin avant gauche du véhicule
        // pendant la phase 2 

        const R1 = calculR1(bestE);

        // distance du coin arriere gauche du véhicule garé devant
        // au centre de braquage de la phase2
        const R2 = calculR2(bestE);

        Object.assign($scope, {
            R1,
            R2,
            eNonCollision,
            bestE
        });
    }
    $scope.seGarerAutomatiquement = function seGarerAutomatiquement() {


        calculerRayonDeBracage($scope.e,$scope.d);
        calculDesRayonsCollision();
        calculDuPointInflexion();
        calculerRayonDeBracage($scope.bestE,$scope.d);

        let counter = 0;
        let phase = 0; // 0 => bracage =< 1 contre bracage
        const sécurité = 10;

        function autoStep() {

            if (phase === 2) {
                $scope.angle_roue = 0.0;
                // on avance en X+ pour se rapprocher du véhicule précédent;
                $scope.dist = ($scope.xg1 - $scope.xv) - $scope.longueurVehicule;
                if ($scope.dist > $scope.e) { // le e non modifié ici !
                    $scope.xv += 1;
                    $timeout(autoStep, 20);
                }
                return;
            }
            if ($scope.yv < $scope.inflexionPointY) {
                counter++;
                step();
                $timeout(autoStep, 20);

            } else {
                if (phase === 0) {
                    // il faut contre-braquer
                    $scope.angle_roue = -$scope.angle_roue;
                    phase = 1;
                }
                counter--;
                let alignement = Math.abs($scope.Tv) < 1 * $scope.deg2rad; // le véhicule est-il parallele au trotoir Tv1 =0
                step();
                if (!alignement) {
                    // on test la distance mes1
                    if ($scope.mes1 < sécurité && $scope.s <0) {
                        $scope.angle_roue = -$scope.angle_roue;
                        $scope.s = -$scope.s;
                    }
                    else if ($scope.mes2 < sécurité && $scope.s >0) {
                        $scope.angle_roue = -$scope.angle_roue;
                        $scope.s = - $scope.s;
                    }
                    $timeout(autoStep, 20);
                } else {
                    if ($scope.eajuste > $scope.e) {
                        phase = 2;
                        $timeout(autoStep, 20);
                    }
                }
            }
        }
        autoStep();

    }
    $scope.refresh = function () {

        $scope.xv = $scope.XvInit;
        $scope.yv = $scope.YvInit;
        $scope.Tv = 0;

        $scope.xv = $scope.xg1
        $scope.yv = $scope.yg1 - $scope.largeurVehicule - $scope.d;
        $scope.Tv = 0

        $scope.XvInit = $scope.xv
        $scope.YvInit = $scope.yv


        calculerRayonDeBracage($scope.e,$scope.d);
        calculDesRayonsCollision();
        calculDuPointInflexion();

    

    }

    function test() {

        var increment = 1E-2;

        // position courante contient  xv, yv, Tv, xr, yr, Tr
        current = [0, 0, 0, $scope.Dpv + $scope.Drp, 0, 0];
        for (var i = 0; i < 200; i++) {
            console.log(current);
            current = step(current, increment);
        }
    }
    //test();
    $scope.step = step;
   
    $scope.step();

}]);