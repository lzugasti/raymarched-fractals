#ifdef GL_ES
precision highp float;
precision highp int;
#endif

#define MAX_STEPS 100
#define INTERSECTION_LIMIT 0.001
#define DISTANCE_LIMIT 100.
//#define Power 8.

uniform float millis;
varying vec2 pos;

float getMandleBulbDistance(vec3 point) {
    float Power = 4.*sin(millis/1000.) + 5.;

	vec3 z = point;
	float dr = 1.0;
	float r = 0.0;
	for (int i = 0; i < MAX_STEPS ; i++) {
		r = length(z);
		if (r>DISTANCE_LIMIT) break;
		
		// convert to polar coordinates
		float theta = acos(z.z/r);
		float phi = atan(z.y,z.x);
		dr =  pow( r, Power-1.0)*Power*dr + 1.0;
		
		// scale and rotate the point
		float zr = pow(r,Power);
		theta = theta*Power;
		phi = phi*Power;
		
		// convert back to cartesian coordinates
		z = zr*vec3(sin(theta)*cos(phi), sin(phi)*sin(theta), cos(theta));
		z+=point;
	}
	return 0.5*log(r)*r/dr;
}

float getDistance(vec3 point) {
    // // Objects in scene
    // vec3 planePos = vec3(0.);
    // vec3 spherePos = vec3(0., 1, 6.);
    // float sphereRadius = 1.;

    // // distance to axis aligned plane
    // float planeDis = point.y - planePos.y;
    // // distance to sphere
    // float sphereDis = distance(spherePos, point) - sphereRadius;
    // return min(planeDis, sphereDis);
    return getMandleBulbDistance(point);
}

vec3 getNormal(vec3 point) {
    // sample x, y and z distance to approximate normal vector
    vec3 sample = vec3(
        getDistance(point - vec3(INTERSECTION_LIMIT, 0, 0)),
        getDistance(point - vec3(0, INTERSECTION_LIMIT, 0)),
        getDistance(point - vec3(0, 0, INTERSECTION_LIMIT))
        );
    vec3 n = getDistance(point) - sample;
    return normalize(n);
}

vec2 march(vec3 origin, vec3 direction) {
    // Start with a distance of 0
    float distanceFromOrigin = 0.;

    float stepCount = 0.;
    // Limit process to MAX_STEPS iterations
    for(int i=0; i<MAX_STEPS; i++) {
        // March to the next point
        vec3 point = origin + distanceFromOrigin * direction;
        
        // Distance to closest object
        float distanceToObject = getDistance(point);
        
        // Marching distance updated
        distanceFromOrigin += distanceToObject;
        
        stepCount += 1.;

        // If close enough consider this an intersection
        // OR 
        // too far consider not hitting anything
        if (distanceToObject < INTERSECTION_LIMIT) {
            break;
        }
        if (distanceFromOrigin > DISTANCE_LIMIT) {
            stepCount = 0.;
            break;
        }
    }
    return vec2(distanceFromOrigin,stepCount);
}

float getLight(vec3 point) {
    // set a light position
    vec3 lightPos = vec3(0, 5., 5.);
    // move light
    //lightPos.xz += vec2(sin(millis/1000.),  cos(millis/1000.)) * 4.;
    
    // get direction to light from point (normalized)
    vec3 lightDir = normalize(lightPos - point);
    
    // get normal
    vec3 normalDir = getNormal(point);

    // diffuse quantitiy (aka dot product between light and normal)
    float diffuse = clamp(dot(lightDir, normalDir), 0., 1.);
    // compute shadow
    vec2 distanceToLight = march(point + 20.*INTERSECTION_LIMIT * normalDir, lightDir);
    if(distanceToLight.x < distance(point, lightPos))
        diffuse *= .05;

    //return diffuse;
    return diffuse;
}

void main() {
    // black pixel color
    vec3 col = vec3(1.);
    
    // Camera Position
    vec3 cameraPos = vec3(3., 1.2, 1.5); // 1 above ground origin
    //vec3 cameraPos = vec3(0, 1, 0); // 1 above ground origin
    
    // ray direction
    vec3 rayDir = normalize(vec3(pos.x, pos.y, 1.));
    
    vec4 homogeneousRayDir = vec4(rayDir, 1.);
    float angleX=-2.;
    mat4 rotationMatrixX = mat4(
        vec4(1., 0., 0., 0.),
        vec4(0., cos(angleX), sin(angleX), 0.),
        vec4(0., -sin(angleX), cos(angleX), 0.),
        vec4(0., 0., 0., 1.));
        
    float angleZ=-1.25;
    mat4 rotationMatrixZ = mat4(
        vec4(cos(angleZ),  -sin(angleZ), 0., 0.),
        vec4(sin(angleZ), cos(angleZ),  0.,0.),
        vec4(0., 0., 1., 0.),
        vec4(0., 0., 0., 1.));


    rayDir = (homogeneousRayDir * rotationMatrixX * rotationMatrixZ).xyz;


    vec2 intersectionDist = march(cameraPos, rayDir);
    vec3 point = cameraPos + intersectionDist.x * rayDir;
    float diffuse = getLight(point);
    vec3 darkColor = vec3(0.11, 0.05, 0.15);
    vec3 lightColor = vec3(0.77, 0.01, 0.18);
    vec3 borderColor = vec3(0.);
    if(intersectionDist.x < DISTANCE_LIMIT)
        borderColor = mix(lightColor, darkColor, clamp(sqrt(((intersectionDist.y) / 20.)), 0., 1.));
    col = borderColor;

    // Output to screen
    gl_FragColor = vec4(col,1.0);
}