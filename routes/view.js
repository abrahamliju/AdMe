"use strict";

const express = require('express');
const routes = express.Router();

module.exports = (knex) => {

  routes.get("/", (req, res) => {
    knex("users").select("*").where("id", '=', req.session.userId ).then((users) => {
      var user = users[0];
      knex("products")
        .select("*")
        .then((results) => {
          let templateVars = {
            products: results.reverse(),
            path: "/view",
            loggedUser: user.role
          }

          res.render("userAds", templateVars);
        });
    })

  });


  routes.get("/stats", (req, res) => {
    knex("products")
      .join('shared_links', 'products.id', '=', 'shared_links.products_id')
      .join('users', 'users.id', '=', 'shared_links.users_id')
      .select("*")
      .where('shared_links.users_id', '=', req.session.userId)
      .then((results) => {

        let moolah = 0;
        results.forEach( function(value, index){
          moolah += value.click_count * value.cost
        })


        let templateVars = {
          name: results[0].name,
          email: results[0].email,
          moolah: moolah,
          products: results.reverse(),
          loggedUser: results[0].role
        }

        res.render("userstats", templateVars);
      });

  });


  routes.get("/ads/:product_id", (req, res) => {
    let p_id = req.params.product_id;
    var count = [];
    var platfom = []
    knex("users").select("*").where("id", '=', req.session.userId ).then((users) => {
      let user = users[0];
      knex("products")
        .join('shared_links', 'products.id', '=', 'shared_links.products_id' )
        .join('users', 'users.id', '=', 'shared_links.users_id')
        .select("*")
        .where( 'shared_links.products_id', '=', p_id)
        .then((results) => {
          console.log(results);
          for (var i = 0; i < results.length; i++){
           count.push(results[i].click_count)
           platfom.push(results[i].platform);
          }
          let product = results[0];
          let facebook_url = "http://www.facebook.com/dialog/feed/?app_id="
          let app_id = 267633323688936;
          let name = product.title;
          let picture = "http%3A%2F%2Fimage.ibb.co%2Fm8x55a%2Fsolution.jpg"
          let desc = product.desc;
          let fb_path = `facebook_url${app_id}&name={name}&link=http%3A%2F%2Fwww.google.ca&picture=${picture}&description=${desc}&redirect_uri=http%3A%2F%2Fwww.google.ca`

          let templateVars = {
            loggedUser: user.role,
            labels: JSON.stringify(platfom),
            ads: count,
            product: product,
            path: fb_path,
            path2: "asdf"
          }
          if (results.length > 0){
            res.render("productPage", templateVars);
          } else {
            res.sendStatus(500);
          }
        });
      });
  });

  // routes.get("/:product_id/share/fb", (req, res) => {
  //   let p_id = req.params.product_id;
  //   let userId = req.session.user_id;
  //   // INSERT INTO shared_links (id,products_id, users_id, platform, cost, click_count) VALUES
  //   knex
  //     .raw(`INSERT INTO shared_links (products_id, users_id, platform, cost, click_count) VALUES (${p_id},${userId}?,FB,1.10,0) ON CONFLICT ("products_id", "users_id", "platform")
  //   DO NOTHING`)
  //     .then((result) => {

  //     });
  // });

  // routes.get("/:product_id/share/tw", (req, res) => {
  //   var p_id = req.params.product_id;
  //   knex("products")
  //     .select("*")
  //     .where({ id: p_id })
  //     .then((results) => {
  //       let templateVars = {
  //         product: results[0],
  //         path: "asdf"
  //       }
  //       console.log(results[0]);
  //       if (results.length > 0){
  //         res.render("productPage", templateVars);
  //       } else {
  //         res.sendStatus(500);
  //       }

  //     });
  // });


  routes.get('/:sl_id', (req, res) => {
    var sharedId = req.params.sl_id;
    knex
        .select("click_count")
        .from("shared_links")
        .where('id','=','sharedId')
        .then((results) => {
          console.log("original", results)
          results[0] += 1;
          console.log("updated", results)
          knex("shared_links").update("click_count", results[0])
        })
  })

  return routes;
}
