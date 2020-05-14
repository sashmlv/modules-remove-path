'use strict';

const fs    = require( 'fs' ),
      path  = require( 'path' ),
      {log} = require( 'maintenance' );

/**
 * Remove path
 * TODO: write test for each case
 * @param {string} targetPath
 * @param {array|regex} includes - array of regex (if provide option, only includes will removed, no more)
 * @param {array|regex} excludes - array of regex
 * @param {boolean} keepRoot - do not remove target directory
 * @param {boolean} log
 * @param {boolean} dry - do not remove files (for testing)
 * @return {undefined}
 **/
function removePathSync( targetPath, opts = {}) {

   try {

      const keepRoot = opts.keepRoot;
      opts.keepRoot = undefined;

      /* wrap regex into array */
      if( opts.includes instanceof RegExp ) {

         opts.includes = [ opts.includes ];
      }
      if( opts.excludes instanceof RegExp ) {

         opts.excludes = [ opts.excludes ];
      }
      if( opts.includes && ( ! Array.isArray( opts.includes ) || opts.includes.find( rg => ! ( rg instanceof RegExp )))) {

         throw new Error( `Bad 'includes' option, please provide RegEx or [RegEx]` );
      }
      if( opts.excludes && ( ! Array.isArray( opts.excludes ) || opts.excludes.find( rg => ! ( rg instanceof RegExp )))) {

         throw new Error( `Bad 'excludes' option, please provide RegEx or [RegEx]` );
      }

      let stat;

      stat = fs.lstatSync( targetPath );

      if( stat.isFile()) {

         if( canRemove( targetPath, opts )) {

            opts.log && log.blue( `remove file: ${ targetPath }` );
            ! opts.dry && fs.unlinkSync( targetPath );
         }
      }

      /* for directory recursion */
      else if( stat.isDirectory()) {

         const targetPaths = fs.readdirSync( targetPath )
               .map( v => path.resolve( `${ targetPath }/${ v }` ));

         for( let i = 0; i < targetPaths.length; i++ ) {

            removePathSync( targetPaths[ i ], opts );
         };

         if( ! keepRoot && canRemove( targetPath, opts )) {

            if( fs.readdirSync( targetPath ).length ){

               throw new Error( `Can't remove ${ targetPath }, directoty not empty` );
            }

            opts.log && log.blue( `remove directory: ${ targetPath }` );
            ! opts.dry && fs.rmdirSync( targetPath );
         }
      };
   }
   catch( e ) {

      if( e.code !== 'ENOENT' ) {

         log.red( e );
      }
   }
}

/**
 * Check can remove path
 * @param {string} targetPath
 * @param {array|regex} opts.includes - array of regex
 * @param {array|regex} opts.excludes - array of regex
 * @return {boolean} Result can remove
 **/
function canRemove( targetPath, opts = {}){

   if( typeof targetPath !== 'string' ){

      throw new Error( `Bad 'targetPath' option, please provide path for remove` );
   }

   /* if we have includes option, so default do not remove path */
   let can = ! opts.includes;

   if( opts.includes ){

      can = opts.includes.find( rg => rg.test( targetPath ));
   }
   if( opts.excludes ){

      can = ! opts.excludes.find( rg => rg.test( targetPath ));
   }

   return Boolean( can );
}

module.exports = {

   removePathSync
};